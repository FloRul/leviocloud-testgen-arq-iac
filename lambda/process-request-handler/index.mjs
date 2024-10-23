import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export const handler = async (event) => {
  const s3Client = new S3Client({});
  const sqsClient = new SQSClient({});

  const bucketName = "claude-invoke-function-bucket";
  const requestBody = event.body ? JSON.parse(event.body) : {};
  const directory = "files/uploaded-files";
  const files = requestBody.files || [];
  const sqsQueueUrl =
    "https://sqs.us-east-1.amazonaws.com/446872271111/claude-request-queue";

  const responses = [];

  for (const fileName of files) {
    try {
      // Vérifier si le fichier existe dans S3
      const headObjectCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: `${directory}/${fileName}`,
      });
      await s3Client.send(headObjectCommand);

      // Envoyer un message à SQS indiquant que le fichier existe

      const params = {
        fileName: fileName,
        prompt: requestBody.prompt,
        model: requestBody.model,
      };

      const sendMessageCommand = new SendMessageCommand({
        QueueUrl: sqsQueueUrl,
        MessageBody: JSON.stringify(params),
      });
      const sqsResponse = await sqsClient.send(sendMessageCommand);
      responses.push({ fileName, messageId: sqsResponse.MessageId });
    } catch (error) {
      if (error.name === "NotFound") {
        // Fichier non trouvé
        const message = `Le fichier ${fileName} n'existe pas dans S3.`;
        console.error(`Error processing file ${fileName}:`, error);
        responses.push({ fileName, error: message });
      } else {
        console.error(`Error processing file ${fileName}:`, error);
        responses.push({ fileName, error: error.message });
      }
    }
  }

  const response = {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,  X-Api-Key",
    },
    statusCode: 200,
    body: JSON.stringify(responses),
  };
  return response;
};
