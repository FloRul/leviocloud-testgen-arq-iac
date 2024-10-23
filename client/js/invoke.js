const loadingDiv = document.getElementById("loading");

const showSpinner = () => {
  document.getElementById("spinner").style.display = "flex";
};

const hideSpinner = () => {
  document.getElementById("spinner").style.display = "none";
};

async function invokeClaude() {
  const model = document.getElementById("modelSelect").value;
  const selectedFileItems = document.querySelectorAll(
    "#serverFileList .file-item.selected"
  );

  const sourceCodeFiles = Array.from(selectedFileItems, (item) => {
    return item.querySelector("span.text-left").textContent;
  });

  if (sourceCodeFiles.length === 0) {
    alert("Please select files to process.");
    return;
  }

  const prompt = document.getElementById("prompt").value;
  if (prompt.length === 0) {
    alert("Please enter a query.");
    return;
  }

  showSpinner();
  loadingDiv.style.visibility = "visible";

  try {
    const response = sourceCodeFiles
      ? await invokeWithFiles(model, prompt, sourceCodeFiles)
      : await invokeWithCode(model, prompt, sourceCode);
    console.log(response);
  } catch (error) {
    displayError(responseField, error);
  }

  loadingDiv.style.visibility = "hidden";
  hideSpinner();
}

async function fetchFromAPI(url, options) {
  try {
    const response = await fetch(url, options);
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
}

async function invokeWithFiles(model, prompt, files) {
  const requestData = { model: model, prompt: prompt, files: files };
  return fetch(`${getApiUrl()}/invoke`, {
    method: "POST",
    body: JSON.stringify(requestData),
  });
}

async function handleResponse(response) {
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("HTTP error: " + response.statusText);
  }
}

function displayError(field, error) {
  field.value = "Error: " + error.message;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig(); // Charger la configuration au démarrage

  const sourceCodeInput = document.getElementById("sourceCode");
  const sourceCodeFileInput = document.getElementById("sourceCodeFile");

  sourceCodeInput.addEventListener("input", function () {
    sourceCodeFileInput.disabled = sourceCodeInput.value.trim() !== "";
  });

  sourceCodeFileInput.addEventListener("change", function () {
    sourceCodeInput.disabled = sourceCodeFileInput.files.length > 0;
  });

  document
    .getElementById("sourceCodeFile")
    .addEventListener("change", function (event) {
      const file = event.target.files[0];
      const maxFileSize = 10 * 1024 * 1024;
      const sourceCodeFileMsg = document.getElementById("sourceCodeFileMsg");
      const generateBtn = document.getElementById("generateBtn");

      if (file.size > maxFileSize) {
        sourceCodeFileMsg.style.visibility = "visible";
        generateBtn.disabled = true;
      } else {
        sourceCodeFileMsg.style.visibility = "hidden";
        generateBtn.disabled = false;
      }
    });
});
