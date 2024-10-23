// config.js
let API_URL;

async function loadConfig() {
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

function getApiUrl() {
  return API_URL;
}
