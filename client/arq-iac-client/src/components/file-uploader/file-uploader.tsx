import React, { useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { fetchFiles, uploadFiles } from "../../utils/api-utils";
import { languages } from "../../utils/languages";
import { useFileContext } from "../contexts/file-context";

interface FileUploaderProps {
  onClose: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const { language } = useLanguage();
  const t = languages[language];
  const { setFiles: updateFiles } = useFileContext();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const fileArray = [...selectedFiles];

    const allowedTypes = [
      "text/plain", // Fichiers texte
      "application/json", // Fichiers JSON
      "application/javascript", // Fichiers JavaScript (.js)
      "text/javascript", // Fichiers JavaScript (.js)
      "application/x-typescript", // TypeScript (.ts)
      "application/typescript", // TypeScript (.ts)
      "application/javascript", // TypeScript JSX (.tsx)
      "text/x-python", // Python (.py)
      "text/x-java-source", // Java (.java)
      "application/x-java", // Fichiers compilés Java (bytecode)
      "application/x-msdownload", // Fichiers .NET (compilés comme DLL)
      "application/x-dotnet", // Fichiers .NET en général
      "text/x-c", // C (.c)
      "text/x-c++", // C++ (.cpp)
      "text/x-ruby", // Ruby (.rb)
      "text/x-go", // Go (.go)
      "text/x-sh", // Shell script (.sh)
      "text/x-perl", // Perl (.pl)
      "application/x-ruby", // Ruby (.rb)
      "text/x-swift", // Swift (.swift)
      "text/x-haskell", // Haskell (.hs)
      "application/x-java-archive", // Fichiers JAR (.jar)
    ];
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

        onClose();
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
      <div className="text-sm">{t["allowed-format"]}</div>
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
        <div className="file-list mt-2 ">
          <p>{t["selected-files"]}</p>
          {files.map((file, index) => (
            <div
              key={index}
              className="file-item flex justify-between items-center mb-2"
            >
              <span>
                {file.name.length > 30
                  ? file.name.substring(0, 30) + "..."
                  : file.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="sm:col-span-6 mt-4">
        <button
          id="uploadButton"
          type="button"
          className="group bg-cyan-900 hover:bg-green-500 text-white rounded-full mr-5"
          onClick={handleUploadFile}
        >
          <span className="relative" data-key="upload-button-span">
            {t["upload-button-span"]}
          </span>
        </button>
        <button
          type="button"
          className="group  hover:bg-neutral-500 text-cyan-900 hover:text-white rounded-full  px-4 border border-cyan-900"
          onClick={onClose}
        >
          {t["close"]}
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
