import { S3Client, paginateListObjectsV2 } from "@aws-sdk/client-s3";

export const handler = async (event) => {
  const client = new S3Client({});
  const bucketName = "claude-invoke-function-bucket";

  // Extraire le répertoire de la requête
  const type = event.queryStringParameters?.type
    ? `${event.queryStringParameters.type}/`
    : "uploaded-files";

  const objects = [];

  try {
    const directory = `files/${type}`;

    const paginator = paginateListObjectsV2(
      { client, pageSize: 10 },
      { Bucket: bucketName, Prefix: directory } // Utiliser le répertoire de la requête
    );

    for await (const page of paginator) {
      if (page.Contents) {
        // Filtrer les objets et enlever le préfixe du répertoire
        const filteredObjects = page.Contents.filter(
          (o) => o.Key !== directory && o.Key.startsWith(directory)
        ).map((o) => ({
          key: o.Key.replace(directory, ""), // Enlever le préfixe
          lastModified: o.LastModified, // Inclure la date de dernière modification
        }));

        objects.push(...filteredObjects);
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,",
      },
      body: JSON.stringify(objects),
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
