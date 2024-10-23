import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const handler = async (event) => {
  const client = new S3Client({});
  const bucketName = "claude-invoke-function-bucket";

  const requestBody = event.body ? JSON.parse(event.body) : {};
  const type = requestBody.type;
  const directory = `files/${type}` || "files";
  const files = requestBody.files || [];

  try {
    if (!Array.isArray(files) || files.length === 0) {
      return {
        statusCode: 400, // Mauvaise requête
        body: JSON.stringify({
          message: "Liste de fichiers manquante ou vide.",
        }),
      };
    }

    // Traitement de chaque fichier dans la liste
    for (const file of files) {
      if (!file.fileName || !file.fileContent) {
        return {
          statusCode: 400, // Mauvaise requête
          body: JSON.stringify({
            message: "Nom de fichier ou contenu manquant pour un fichier.",
          }),
        };
      }

      // Préparez les paramètres pour l'upload
      const params = {
        Bucket: bucketName,
        Key: `${directory}/${file.fileName}`,
        Body: Buffer.from(file.fileContent, "base64"), // Décodage de base64
      };

      // Effectuez l'upload
      await client.send(new PutObjectCommand(params));
    }

    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,  X-Api-Key",
      },
      statusCode: 200,
      body: JSON.stringify({ message: "Upload réussi" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(
        `Erreur lors de la récupération des fichiers: ${error.message}`
      ),
    };
  }
};
