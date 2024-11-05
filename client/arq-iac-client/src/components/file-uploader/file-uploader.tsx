import React, { useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { fetchFiles, uploadFiles } from "../../utils/api-utils";
import { languages } from "../../utils/languages";
import { useFileContext } from "../file-context/file-context";

const FileUploader: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const { language } = useLanguage();
  const t = languages[language];
  const { setFiles: updateFiles } = useFileContext();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    const allowedTypes = ["text/plain"];
    const exceedsMaxSize = fileArray.some(
      (file) => file.size > 5 * 1024 * 1024
    );
    const invalidType = fileArray.some(
      (file) => !allowedTypes.includes(file.type)
    );

    if (exceedsMaxSize) {
      setErrorMessage(t["source-code-file-span"]);
    } else if (invalidType) {
      setErrorMessage(t["invalid-file-type"]);
    } else {
      setErrorMessage("");
      setFiles(fileArray);
    }
  };

  const handleUploadFile = async () => {
    if (files.length > 0) {
      try {
        await uploadFiles(files);
        const updatedFiles = await fetchFiles("");
        updateFiles(updatedFiles);
        setFiles([]);

        const fileInput = document.getElementById(
          "sourceCodeFile"
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      } catch (error) {
        setErrorMessage("Erreur lors de l'upload des fichiers");
      }
    }
  };

  const removeFile = (fileName: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  return (
    <div className="pf-form-field sm:col-span-6">
      <label
        className="mb-2 block text-p1 text-primary-500 transition-colors duration-200 ease-in-out"
        htmlFor="sourceCodeFile"
        data-key="upload-label"
      >
        {t["upload-label"]}
      </label>
      <input
        type="file"
        id="sourceCodeFile"
        multiple
        onChange={handleFileChange}
        placeholder={t["source-code-input"].text}
      />
      {errorMessage && (
        <span
          className="block"
          id="sourceCodeFileMsg"
          style={{ color: "red" }}
          data-key="source-code-file-span"
        >
          {errorMessage}
        </span>
      )}

      {files.length > 0 && (
        <div className="file-list mt-2 w-1/3">
          <p>Fichiers sélectionnés :</p>
          {files.map((file, index) => (
            <div
              key={index}
              className="file-item flex justify-between items-center mb-2"
            >
              <span>{file.name}</span>
              <button
                onClick={() => removeFile(file.name)}
                className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ml-2"
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="sm:col-span-6 text-center mt-4">
        <button
          id="uploadButton"
          type="button"
          className="group pf-button pf-button--lg pf-button--primary pf-transition-outline h-focus-state"
          onClick={handleUploadFile}
        >
          <span className="relative" data-key="upload-button-span">
            {t["upload-button-span"]}
          </span>
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
