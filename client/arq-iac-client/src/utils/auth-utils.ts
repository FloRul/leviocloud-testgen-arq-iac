import { fetchAuthSession } from "aws-amplify/auth";

export async function getIdToken() {
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
    const idToken = session.tokens?.idToken;

    return idToken?.toString();
    // Vous pouvez maintenant utiliser l'idToken pour authentifier vos requêtes auprès de vos services backend
  } catch (error) {
    console.error("Error retrieving ID token:", error);
  }
}
