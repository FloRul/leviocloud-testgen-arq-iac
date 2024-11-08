import { fetchAuthSession } from "aws-amplify/auth";
import { Job, ServerFile } from "./interfaces";

let API_URL: string | undefined;

const getToken = async () => {
  const session = await fetchAuthSession({ forceRefresh: true });
  const idToken = session.tokens?.idToken?.toString();
  return idToken;
};

export async function loadConfig(): Promise<void> {
  try {
    const response = await fetch("config.json");
    if (!response.ok) throw new Error("Could not load config");
    const config = await response.json();
    API_URL = config.apiUrl;
  } catch (error) {
    console.error("Error loading config:", error);
    alert("Erreur lors du chargement de la configuration.");
  }
}

export function getApiUrl(): string | undefined {
  return API_URL;
}

async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadFiles(files: File[]): Promise<void> {
  try {
    const idToken = await getToken();
    const uploadPromises = files.map(async (file) => {
      try {
        const fileContent = await readFileAsBase64(file);
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/files`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            Authorization: `Bearer ${idToken}`,
            filename: file.name,
          },
          body: fileContent,
        });

        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          console.log(`Upload réussi pour ${file.name}:`, result);
        } else {
          const responseText = await response.text();
          console.error(
            `Erreur lors de l'upload de ${file.name}:`,
            responseText
          );
        }
      } catch (error) {
        console.error(`Erreur lors de l'upload de ${file.name}:`, error);
      }
    });

    await Promise.allSettled(uploadPromises);
  } catch (error) {
    console.error("Network error:", error);
  }
}

export async function fetchFiles(type: string): Promise<ServerFile[]> {
  try {
    const idToken = await getToken();
    const url = type
      ? `${import.meta.env.VITE_BASE_URL}/files?type=${type}`
      : `${import.meta.env.VITE_BASE_URL}/files`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data: ServerFile[] = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching files:", error);
    return [];
  }
}

export async function deleteFiles(fileIds: string[]) {
  try {
    const idToken = await getToken();
    const deletePromises = fileIds.map(async (fileId) => {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/files/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      const contentType = response.headers.get("Content-Type");

      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        console.log(`Delete réussi pour ${fileId}:`, result);
      } else if (response.status === 204) {
        console.log(`Delete réussi pour ${fileId}: Aucun contenu retourné`);
      } else {
        const responseText = await response.text();
        console.error(`Erreur lors du delete de ${fileId}:`, responseText);
      }
    });

    await Promise.all(deletePromises);
    console.log("Tous les fichiers ont été supprimés avec succès.");
  } catch (error) {
    console.error("Erreur réseau lors de la suppression des fichiers:", error);
  }
}

export const submitForm = async (
  model: string,
  selectedFiles: string[],
  prompt: string
): Promise<any> => {
  try {
    const idToken = await getToken();
    const formData = {
      files: selectedFiles,
      prompt: prompt,
      model: model,
    };
    const response = await fetch(`${import.meta.env.VITE_BASE_URL}/jobs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'envoi du formulaire.");
    }

    const result: Job = await response.json();
    console.log("Réponse de l'API:", result);
    return result;
  } catch (error) {
    console.error("Erreur lors de la soumission du formulaire:", error);
    throw new Error("Une erreur s'est produite lors de l'envoi du formulaire.");
  }
};

export const getLink = async (
  jobId: string,
  fileId: string
): Promise<string> => {
  try {
    const idToken = await getToken();
    const url = `${
      import.meta.env.VITE_BASE_URL
    }/jobs/${jobId}/download/${fileId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    if (data && data.presigned_url) {
      return `${data.presigned_url}`; // Retourne seulement l'URL
    } else {
      throw new Error("Presigned URL not found in the response");
    }
  } catch (error) {
    console.error("Error fetching files:", error);
    throw new Error("Error fetching the presigned URL");
  }
};

export async function getJobs(): Promise<Job[]> {
  try {
    const idToken = await getToken();
    const url = `${import.meta.env.VITE_BASE_URL}/jobs`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data: Job[] = await response.json();
    const sortedData = data.sort((a, b) => {
      const dateA = new Date(a.updated_at);
      const dateB = new Date(b.updated_at);
      return dateB.getTime() - dateA.getTime(); // Tri décroissant
    });
    return sortedData;
  } catch (error) {
    console.error("Error fetching files:", error);
    return [];
  }
}
