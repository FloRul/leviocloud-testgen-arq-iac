import React, { useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { languages } from "../../utils/languages";
import FileList from "../file-list/file-list";

const FileUploader: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const { language } = useLanguage();
  const t = languages[language];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    const exceedsMaxSize = fileArray.some(
      (file) => file.size > 10 * 1024 * 1024
    ); // 10 MB

    if (exceedsMaxSize) {
      setErrorMessage(
        "Taille maximale dépassée. La taille maximale autorisée est de 10 Mo."
      );
    } else {
      setErrorMessage("");
      setFiles(fileArray);
    }
  };

  const handleUpload = () => {
    // Handle upload logic here
    console.log("Uploading files:", files);
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
      <FileList files={files} />
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
      <div className="sm:col-span-6 text-center">
        <button
          id="uploadButton"
          type="button"
          className="group pf-button pf-button--lg pf-button--primary pf-transition-outline h-focus-state"
          onClick={handleUpload}
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
