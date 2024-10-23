import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";

export const handler = async (event) => {
  const client = new S3Client({});
  const bucketName = "claude-invoke-function-bucket";

  console.log("event :", JSON.stringify(event, null, 2));

  const requestBody = event.body ? JSON.parse(event.body) : {};
  const type = requestBody.type;
  const directory = `files/${type}` || "files"; // Utiliser 'files' par défaut
  const filesToDelete = requestBody.files || [];

  try {
    if (!Array.isArray(filesToDelete) || filesToDelete.length === 0) {
      return {
        statusCode: 400, // Mauvaise requête
        body: JSON.stringify({
          message: "Liste de fichiers manquante ou vide.",
        }),
      };
    }

    // Traitement de chaque fichier dans la liste
    for (const file of filesToDelete) {
      if (!file) {
        return {
          statusCode: 400, // Mauvaise requête
          body: JSON.stringify({
            message: "Nom de fichier ou contenu manquant pour un fichier.",
          }),
        };
      }

      // Préparez les paramètres pour le delete
      const deleteParams = {
        Bucket: bucketName,
        Delete: {
          Objects: filesToDelete.map((fileName) => ({
            Key: `${directory}/${file}`,
          })),
          Quiet: false,
        },
      };

      // Journaliser les paramètres de suppression
      console.log(
        "Suppression des fichiers avec les paramètres suivants :",
        JSON.stringify(deleteParams, null, 2)
      );

      // Effectuez le delete
      const data = await client.send(new DeleteObjectsCommand(deleteParams));
      console.log("Réponse de S3 :", JSON.stringify(data, null, 2));
    }

    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,  X-Api-Key",
      },
      statusCode: 200,
      body: JSON.stringify({ message: "Delete réussi" }),
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
