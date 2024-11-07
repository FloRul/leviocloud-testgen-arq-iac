import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { fetchFiles, submitForm } from "../../utils/api-utils"; // Fonction pour soumettre à l'API
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

  // Utilisez un effet pour mettre à jour les fichiers du S3 à chaque chargement
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const files = await fetchFiles(""); // Récupère tous les fichiers disponibles dans le S3
        setFiles(files);
      } catch (error) {
        console.error("Erreur lors de la récupération des fichiers", error);
        setError("Erreur lors du chargement des fichiers.");
      }
    };

    loadFiles();
  }, [setFiles]);

  // Gérer la sélection de fichiers dans FileList
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

  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    console.log({ selectedFiles, prompt, selectedModel });
    if (!selectedModel || selectedFiles.size === 0 || !prompt) {
      setError(t["error-message"]);
      return;
    }

    setIsSubmitting(true);
    setError(""); // Réinitialiser les erreurs

    try {
      // Envoi des données à l'API (modèle, fichiers et prompt)
      await submitForm(selectedModel, [...selectedFiles], prompt);
    } catch (error) {
      setError("Erreur lors de l'envoi du formulaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h1>{t["main-title"]}</h1>

      <ModelSelector setSelectedModel={setSelectedModel} />

      <FileList
        selectedFiles={selectedFiles}
        handleFileSelection={handleFileSelection}
        handleAllFileSelection={handleAllFileSelection}
      />

      <PromptInput prompt={prompt} setPrompt={setPrompt} />

      {error && (
        <div className="error-message sm:col-span-6 text-center mt-4 text-red-700">
          {error}
        </div>
      )}

      <div className="sm:col-span-6 text-center mt-4">
        <button
          id="uploadButton"
          type="button"
          className="group pf-button pf-button--lg pf-button--primary pf-transition-outline h-focus-state"
          onClick={handleSubmit}
          disabled={isSubmitting}
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
