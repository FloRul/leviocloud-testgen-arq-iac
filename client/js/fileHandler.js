async function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} : ${hours}:${minutes}`;
}

async function displayFiles(
  listFile = serverFileListDiv,
  type = "",
  filter = ""
) {
  const url = type
    ? `${getApiUrl()}/list-files?type=${type}`
    : `${getApiUrl()}/list-files`;
  const response = await fetch(url);
  const files = await response.json();
  listFile.innerHTML = "";

  const filteredFiles = filter
    ? files.filter((file) =>
        file.key.toLowerCase().includes(filter.toLowerCase())
      )
    : files;

  filteredFiles.forEach((file) => {
    const fileItem = document.createElement("div");
    fileItem.className =
      "file-item flex justify-between items-center p-2 border-b";

    const fileName = document.createElement("span");
    fileName.textContent = file.key;
    fileName.className = "text-left";

    const lastModified = document.createElement("span");
    lastModified.textContent = formatDate(file.lastModified);
    lastModified.className = "text-right";

    fileItem.appendChild(fileName);
    fileItem.appendChild(lastModified);

    fileItem.addEventListener("click", () => {
      fileItem.classList.toggle("selected");
    });

    listFile.appendChild(fileItem);
  });
}

async function uploadFiles(files, type) {
  showSpinner();
  try {
    const body = JSON.stringify({
      type: type,
      files: await Promise.all(
        Array.from(files).map(async (file) => ({
          fileName: file.name,
          fileContent: await readFileAsBase64(file),
        }))
      ),
    });
    const response = await fetchFromAPI(`${getApiUrl()}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });
    const result = await response.json();
    console.log("Upload réussi:", result);
  } catch (error) {
    console.error("Network error:", error);
  }
  await displayFiles(serverFileListDiv, "uploaded-files");
  hideSpinner();
}

async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function downloadFile(fileName) {
  const apiUrl = `${getApiUrl}/download?fileName=${fileName}`;
  showSpinner();
  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors du téléchargement : ${response.statusText}`);
    }

    const fileContent = await response.text();

    const blob = new Blob([fileContent], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erreur :", error);
  }
  hideSpinner();
}

async function deleteFiles(files, type) {
  showSpinner();
  try {
    const body = JSON.stringify({
      type: type,
      files: files,
    });
    const response = await fetchFromAPI(`${getApiUrl()}/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });

    const result = await response.json();
    console.log("Delete réussi:", result);
  } catch (error) {
    console.error("Network error:", error);
  }
  await displayFiles(serverFileListDiv, "uploaded-files");
  hideSpinner();
}
