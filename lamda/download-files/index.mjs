import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const handler = async (event) => {
  console.log("start");
  const client = new S3Client({});
  const bucketName = "claude-invoke-function-bucket";
  const fileName = event.queryStringParameters?.fileName
    ? event.queryStringParameters.fileName
    : null; // Récupérer le nom du fichier des paramètres de chemin

  let response;

  try {
    if (!fileName) {
      return {
        statusCode: 400, // Mauvaise requête
        body: JSON.stringify({ message: "Nom de fichier manquant." }),
      };
    }

    // Préparez les paramètres pour récupérer le fichier
    const params = {
      Bucket: bucketName,
      Key: `files/response-files/${fileName}`, // Chemin dans le bucket
    };

    // Récupérez le fichier
    const data = await client.send(new GetObjectCommand(params));
    const fileContent = await streamToString(data.Body);

    response = {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/octet-stream", // Type de contenu à adapter selon le fichier
      },
      statusCode: 200,
      body: fileContent,
      isBase64Encoded: true, // Indique que le contenu est en base64
    };
  } catch (error) {
    console.error("Erreur:", error);
    response = {
      statusCode: 500,
      body: JSON.stringify({
        message: `Erreur lors du téléchargement : ${error.message}`,
      }),
    };
  }

  return response;
};

// Fonction pour convertir un flux en chaîne
const streamToString = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8"))); // Convertir en base64
  });
};
