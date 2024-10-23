import { loadConfig } from "./config.js";
import {
  deleteFiles,
  displayFiles,
  downloadFile,
  uploadFiles,
} from "./fileHandler.js";

const fileInput = document.getElementById("sourceCodeFile");
const searchInput = document.getElementById("searchFileInput");
const searchResponseInput = document.getElementById("searchResponseFileInput");
const fileListDiv = document.getElementById("uploadFileList");
const serverFileListDiv = document.getElementById("serverFileList");
const responseFileListDiv = document.getElementById("responseFileList");

document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();

  fileInput.addEventListener("change", () => {
    const files = fileInput.files;
    fileListDiv.innerHTML = "";
    if (files.length > 1) {
      for (let i = 0; i < files.length; i++) {
        const listItem = document.createElement("div");
        listItem.textContent = files[i].name;
        fileListDiv.appendChild(listItem);
      }
    }
  });

  document
    .getElementById("uploadButton")
    .addEventListener("click", async () => {
      const files = fileInput.files;
      if (files.length === 0) {
        alert("Please select files to upload.");
        return;
      }

      await uploadFiles(files, "uploaded-files");
    });

  document
    .getElementById("downloadResponseFileButton")
    .addEventListener("click", async () => {
      const selectedFileItems = document.querySelectorAll(
        "#responseFileList .file-item.selected"
      );

      const files = Array.from(selectedFileItems, (item) => {
        return item.querySelector("span.text-left").textContent;
      });

      if (files.length === 0) {
        alert("Veuillez sélectionner des fichiers à télécharger.");
        return;
      }

      for (const fileName of files) {
        await downloadFile(fileName);
      }
    });

  searchInput.addEventListener("input", () => {
    displayFiles(serverFileListDiv, "uploaded-files", searchInput.value);
  });
  displayFiles(serverFileListDiv, "uploaded-files");

  searchResponseInput.addEventListener("input", () => {
    displayFiles(
      responseFileListDiv,
      "response-files",
      searchResponseInput.value
    );
  });
  displayFiles(responseFileListDiv, "response-files");

  document
    .getElementById("deleteButton")
    .addEventListener("click", async () => {
      const selectedFileItems = document.querySelectorAll(
        "#serverFileList .file-item.selected"
      );
      const files = Array.from(selectedFileItems, (item) => item.innerHTML);
      if (files.length === 0) {
        alert("Please select files to delete.");
        return;
      }

      await deleteFiles(files, "uploaded-files");
    });
});
