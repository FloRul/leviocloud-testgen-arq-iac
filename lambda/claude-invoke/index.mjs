import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// Initialize clients outside the handler for better reuse
const s3Client = new S3Client({ region: "us-east-1" });
const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

const CONFIG = {
  bucket: "claude-invoke-function-bucket",
  defaultModel: "anthropic.claude-3-5-sonnet-20240620-v1:0",
  defaultMaxTokens: 4096,
  defaultTemperature: 0.1,
  instructions:
    "Sois aussi exhaustif que possible.\nGénère ta réponse entre les balises suivantes : <reponse></reponse>, n'utilise aucune balise supplémentaire.",
  maxBedrockCallAmount: 7,
};

const extractFormattedResponse = (str) => {
  if (!str) {
    return null;
  }

  // Case insensitive match for the tags
  const regex = /<reponse>([\s\S]*?)<\/reponse>/gi;
  const matches = [...str.matchAll(regex)];

  if (matches.length === 0) {
    return null;
  }

  // If multiple matches found, concatenate them with a space
  if (matches.length > 1) {
    console.warn(
      `Found ${matches.length} response tags - concatenating content`
    );
    return matches
      .map((match) => match[1].trim())
      .filter((content) => content.length > 0)
      .join(" ");
  }

  // Validate the content
  const content = matches[0][1].trim();

  // Check for potentially malformed or nested tags
  if (content.includes("<reponse>") || content.includes("</reponse>")) {
    console.warn("Possible nested or malformed tags detected in response");
  }

  // Check for minimum content
  if (content.length === 0) {
    console.warn("Empty response content detected");
    return null;
  }

  return content;
};

const streamToString = async (stream) => {
  if (stream instanceof Uint8Array) {
    return new TextDecoder("utf-8").decode(stream);
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });
};

async function callBedrock(
  systemPrompt,
  userInput,
  modelId = CONFIG.defaultModel,
  maxTokens = CONFIG.defaultMaxTokens,
  temperature = CONFIG.defaultTemperature
) {
  try {
    const requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      temperature: temperature,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: userInput }],
        },
      ],
    };

    const response = await bedrockClient.send(
      new InvokeModelCommand({
        modelId,
        body: JSON.stringify(requestBody),
      })
    );

    const responseBody = await streamToString(response.body);
    const parsedResponse = JSON.parse(responseBody);

    if (!parsedResponse.content?.[0]?.text) {
      throw new Error("Invalid response format from Bedrock");
    }

    return parsedResponse.content[0].text;
  } catch (error) {
    console.error("Error calling Bedrock:", error);
    throw new Error(`Bedrock API call failed: ${error.message}`);
  }
}

export const handler = async (event) => {
  try {
    const responses = await Promise.all(
      event.Records.map(async (record) => {
        const { fileName, prompt, model } = JSON.parse(record.body);

        try {
          // Get file from S3
          const s3Response = await s3Client.send(
            new GetObjectCommand({
              Bucket: CONFIG.bucket,
              Key: `files/uploaded-files/${fileName}`,
            })
          );

          const fileContent = await streamToString(s3Response.Body);
          const systemPrompt = prompt + CONFIG.instructions;

          // Initialize variables for the loop
          let output = fileContent;
          let callCount = 0;
          let validResponse = false;

          // Loop for Bedrock API calls
          while (callCount < CONFIG.maxBedrockCallAmount && !validResponse) {
            const bedrockResponse = await callBedrock(
              systemPrompt,
              output,
              model
            );
            output += bedrockResponse;
            callCount++;

            const extractedResponse = extractFormattedResponse(output);
            if (extractedResponse) {
              validResponse = true;
              output = extractedResponse; // Only save the valid extracted response
            }

            console.log(`Bedrock API call attempt ${callCount}`);
          }

          if (!validResponse) {
            console.log(
              `Failed to get valid response for ${fileName} after ${CONFIG.maxBedrockCallAmount} attempts`
            );
          }

          // Store response in S3
          const responseKey = `files/response-files/${fileName}-response.txt`;
          await s3Client.send(
            new PutObjectCommand({
              Bucket: CONFIG.bucket,
              Key: responseKey,
              Body: output,
            })
          );

          return {
            fileName,
            status: validResponse ? "success" : "failed",
            responseKey,
            callCount,
          };
        } catch (error) {
          console.error(`Error processing file ${fileName}:`, error);
          return {
            fileName,
            status: "error",
            error: error.message,
          };
        }
      })
    );

    const failedFiles = responses.filter((r) => r.status === "error");
    if (failedFiles.length > 0) {
      return {
        statusCode: 207,
        body: JSON.stringify({
          message: "Some files failed to process",
          results: responses,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "All files processed successfully",
        results: responses,
      }),
    };
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};
