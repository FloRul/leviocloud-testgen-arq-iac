import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { fetchFiles, submitForm } from "../../utils/api-utils";
import { languages } from "../../utils/languages";
import { useFileContext } from "../file-context/file-context";
import FileList from "../file-list/file-list";
import ModelSelector from "../model-selector/model-selector";
import PromptInput from "../prompt-imput/prompt-imput";

const ClaudeForm: React.FC = () => {
  const { language } = useLanguage();
  const t = languages[language];
  const { setFiles } = useFileContext();

  const [selectedModel, setSelectedModel] = useState<string>(
    "anthropic.claude-3-sonnet-20240229-v1:0"
  );
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const files = await fetchFiles("");
        setFiles(files);
      } catch (error) {
        console.error("Erreur lors de la récupération des fichiers", error);
        setError("Erreur lors du chargement des fichiers.");
      }
    };

    loadFiles();
  }, [setFiles]);

  const handleFileSelection = (fileId: string) => {
    const updatedSelection = new Set(selectedFiles);
    if (updatedSelection.has(fileId)) {
      updatedSelection.delete(fileId);
    } else {
      updatedSelection.add(fileId);
    }
    setSelectedFiles(updatedSelection);
  };

  const handleAllFileSelection = (fileIds: string[]) => {
    const updatedSelection = new Set(fileIds);
    setSelectedFiles(updatedSelection);
  };

  const handleSubmit = async () => {
    if (!selectedModel || selectedFiles.size === 0 || !prompt) {
      setError(t["error-message"]);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await submitForm(selectedModel, [...selectedFiles], prompt);
    } catch (error) {
      setError("Erreur lors de l'envoi du formulaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormInvalid = !prompt || selectedFiles.size === 0;

  return (
    <>
      <ModelSelector setSelectedModel={setSelectedModel} />

      <FileList
        selectedFiles={selectedFiles}
        handleFileSelection={handleFileSelection}
        handleAllFileSelection={handleAllFileSelection}
      />

      <PromptInput prompt={prompt} setPrompt={setPrompt} />

      {isFormInvalid && (
        <div className="error-message sm:col-span-6 text-center mt-4 text-red-700">
          <span>{t["fields-required"]}</span>
        </div>
      )}

      <div className="sm:col-span-6 text-center mt-4">
        <button
          id="uploadButton"
          type="button"
          className={`${
            isFormInvalid || isSubmitting
              ? "bg-slate-400 text-white rounded-full"
              : "bg-cyan-900 hover:bg-green-500 text-white rounded-full"
          }`}
          onClick={handleSubmit}
          disabled={isFormInvalid || isSubmitting}
        >
          <span className="relative" data-key="upload-button-span">
            {isSubmitting ? t["submitting"] : t["submit"]}
          </span>
        </button>
      </div>
    </>
  );
};

export default ClaudeForm;
