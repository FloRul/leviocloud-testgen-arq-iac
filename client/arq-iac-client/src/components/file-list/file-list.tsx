// file-list.tsx
import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { deleteFiles } from "../../utils/api-utils";
import { ServerFile } from "../../utils/interfaces";
import { languages } from "../../utils/languages";
import { formatDate } from "../../utils/utils";
import { useFileContext } from "../file-context/file-context";
import FileUploader from "../file-uploader/file-uploader";
import Modal from "../modal/modal";

interface FileListProps {
  selectedFiles: Set<string>; // Fichiers actuellement sélectionnés
  handleFileSelection: (fileId: string) => void; // Fonction de sélection/désélection
}

const FileList: React.FC<FileListProps> = ({
  selectedFiles,
  handleFileSelection,
}) => {
  const { language } = useLanguage();
  const t = languages[language];

  const { setFiles: updateFiles, files: contextFiles } = useFileContext(); // Récupérer les fichiers du contexte
  const [filteredFiles, setFilteredFiles] = useState<ServerFile[]>([]);
  const [filter, setFilter] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Filtrage des fichiers en fonction de la recherche
  useEffect(() => {
    if (filter === "") {
      setFilteredFiles(contextFiles); // Utilisation de contextFiles au lieu de files
    } else {
      setFilteredFiles(
        contextFiles.filter((file) =>
          file.filename.toLowerCase().includes(filter.toLowerCase())
        )
      );
    }
  }, [filter, contextFiles]);

  // Gérer la sélection de tous les fichiers
  const handleSelectAll = () => {
    if (
      filteredFiles.length === 0 ||
      selectedFiles.size === filteredFiles.length
    ) {
      filteredFiles.forEach((file) => handleFileSelection(file.file_id)); // Désélectionner tous
    } else {
      filteredFiles.forEach((file) => handleFileSelection(file.file_id)); // Sélectionner tous
    }
  };

  // Gérer la suppression des fichiers sélectionnés
  const handleDelete = async () => {
    if (selectedFiles.size > 0) {
      try {
        await deleteFiles(Array.from(selectedFiles));
        // Actualiser la liste des fichiers après suppression
        updateFiles(
          contextFiles.filter((file) => !selectedFiles.has(file.file_id))
        );
      } catch (error) {
        console.error("Erreur lors de la suppression des fichiers", error);
      }
    } else {
      console.log("Aucun fichier sélectionné");
    }
  };

  return (
    <div className="file-list pf-form-field sm:col-span-6">
      {/* Champ de recherche pour filtrer les fichiers */}
      <input
        type="text"
        placeholder={t["search-files"]}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="search-input"
      />

      {/* Tableau des fichiers */}
      <table className="file-table w-full">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left bg-gray-200 w-1/12">
              <input
                type="checkbox"
                checked={
                  filteredFiles.length > 0 &&
                  selectedFiles.size === filteredFiles.length
                }
                onChange={handleSelectAll}
                disabled={filteredFiles.length === 0}
              />
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left bg-gray-200 w-7/12">
              {t["file-name"]}
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left bg-gray-200 w-4/12">
              {t["file-last-update"]}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredFiles.length > 0 &&
            filteredFiles.map((file) => (
              <tr key={file.file_id} className="file-item">
                <td className="border border-gray-300 px-4 py-2 w-1/12">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.file_id)}
                    onChange={() => handleFileSelection(file.file_id)}
                  />
                </td>
                <td className="border border-gray-300 px-4 py-2 w-7/12">
                  {file.filename}
                </td>
                <td className="border border-gray-300 px-4 py-2 w-4/12">
                  {formatDate(file.last_modified)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <Modal isOpen={isModalOpen}>
        <FileUploader onClose={closeModal} />
      </Modal>

      {/* Bouton de suppression des fichiers sélectionnés */}
      <div className="sm:col-span-6 text-center mt-4">
        <button
          type="button"
          onClick={openModal}
          className="group pf-button pf-button--lg pf-button--primary pf-transition-outline h-focus-state h-focus-state--offset-primary"
        >
          {t["add-files"]}
        </button>
        <button
          id="deleteButton"
          type="button"
          className="group pf-button pf-button--lg pf-button--primary pf-transition-outline h-focus-state h-focus-state--offset-primary"
          onClick={handleDelete}
        >
          <span className="relative" data-key="delete-files-button-span">
            {t["delete-file-button-span"]}
          </span>
        </button>
      </div>
    </div>
  );
};

export default FileList;
