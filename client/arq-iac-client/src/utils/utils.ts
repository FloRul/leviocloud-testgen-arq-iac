export function formatDate(input: Date | string | number): string {
  // Si l'entrée est une chaîne de caractères ou un nombre, la convertir en objet Date
  let date: Date;

  if (typeof input === "string") {
    date = new Date(input); // Convertit la chaîne en Date
  } else if (typeof input === "number") {
    date = new Date(input * 1000); // Convertit le timestamp en Date
  } else {
    date = input; // Si c'est déjà une instance de Date, on l'utilise directement
  }
  if (!date) return "";
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    throw new Error("Date invalide");
  }

  // Formatage de la date en chaîne au format "yyyy-mm-dd : hh:mm"
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Mois 1-12
  const day = String(date.getDate()).padStart(2, "0"); // Jour
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} : ${hours}:${minutes}`;
}
