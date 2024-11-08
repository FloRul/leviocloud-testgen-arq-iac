import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { fetchFiles, submitForm } from "../../utils/api-utils";
import { languages } from "../../utils/languages";
import { useFileContext } from "../contexts/file-context";
import { useJobContext } from "../contexts/job-context";
import FileList from "../file-list/file-list";
import PromptInput from "../prompt-imput/prompt-imput";

const ClaudeForm: React.FC = () => {
  const { language } = useLanguage();
  const t = languages[language];
  const { setFiles } = useFileContext();
  const { loadJobs } = useJobContext();

  const selectedModel = "anthropic.claude-3-sonnet-20240229-v1:0";
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [submissionSuccess, setSubmissionSuccess] = useState(false); // Nouvel état pour la réussite

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const files = await fetchFiles("");
        setFiles(files);
      } catch (e) {
        console.error("Erreur lors de la récupération des fichiers", e);
        setError("Erreur lors du chargement des fichiers.");
        console.error(error);
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
    setSubmissionSuccess(false); // Réinitialise le succès avant chaque soumission

    try {
      await submitForm(selectedModel, [...selectedFiles], prompt);

      handleAllFileSelection([]);
      setPrompt("");
      setSubmissionSuccess(true); // Message de succès après une soumission réussie
      loadJobs(true);
    } catch (error) {
      setError("Erreur lors de l'envoi du formulaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormInvalid = !prompt || selectedFiles.size === 0;

  return (
    <>
      <div className="file-list pf-form-field sm:col-span-6 border-b border-secondary-500">
        <h2
          className="text-h3 uppercase font-display font-semibold tracking-[0.3em] mb-6 mt-0"
          data-key="main-title"
        >
          {t["main-title"]}
        </h2>
      </div>

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

      {submissionSuccess && (
        <div className="success-message sm:col-span-6 text-center mt-4 text-green-700">
          <span>{t["request-success"]}</span>{" "}
        </div>
      )}
    </>
  );
};

export default ClaudeForm;
