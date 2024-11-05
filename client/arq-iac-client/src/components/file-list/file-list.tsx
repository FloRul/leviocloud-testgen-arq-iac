import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { deleteFiles, fetchFiles, ServerFile } from "../../utils/api-utils";
import { languages } from "../../utils/languages";
import { formatDate } from "../../utils/utils";
import { useFileContext } from "../file-context/file-context";

const FileList: React.FC = () => {
  const { setFiles: updateFiles, files: contextFiles } = useFileContext();
  const { language } = useLanguage();
  const t = languages[language];
  const [filteredFiles, setFilteredFiles] = useState<ServerFile[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const files: ServerFile[] = await fetchFiles("");
        updateFiles(files);
        setFilteredFiles(files);
      } catch (error) {
        console.error("Erreur lors du chargement des fichiers", error);
      }
    };
    loadFiles();
  }, [updateFiles]);

  useEffect(() => {
    if (filter === "") {
      setFilteredFiles(contextFiles);
    } else {
      setFilteredFiles(
        contextFiles.filter((file) =>
          file.filename.toLowerCase().includes(filter.toLowerCase())
        )
      );
    }
  }, [filter, contextFiles]);

  const handleFileSelection = (fileId: string) => {
    const updatedSelection = new Set(selectedFiles);
    updatedSelection.has(fileId)
      ? updatedSelection.delete(fileId)
      : updatedSelection.add(fileId);
    setSelectedFiles(updatedSelection);
  };

  const handleSelectAll = () => {
    if (
      filteredFiles.length === 0 ||
      selectedFiles.size === filteredFiles.length
    ) {
      setSelectedFiles(new Set());
    } else {
      const allFileIds = filteredFiles.map((file) => file.file_id);
      setSelectedFiles(new Set(allFileIds));
    }
  };

  const handleDelete = async () => {
    if (selectedFiles.size > 0) {
      try {
        await deleteFiles(Array.from(selectedFiles));
        const files: ServerFile[] = await fetchFiles("");
        updateFiles(files);
        setFilteredFiles(files);
        setSelectedFiles(new Set());
      } catch (error) {
        console.error("Erreur lors de la suppression des fichiers", error);
      }
    } else {
      console.log("Aucun fichier sélectionné");
    }
  };

  return (
    <div className="file-list pf-form-field sm:col-span-6">
      <input
        type="text"
        placeholder="Rechercher un fichier..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="search-input"
      />
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

      <div className="sm:col-span-6 text-center mt-4">
        <button
          id="uploadButton"
          type="button"
          className="group pf-button pf-button--lg pf-button--primary pf-transition-outline h-focus-state"
          onClick={handleDelete}
        >
          <span className="relative" data-key="upload-button-span">
            {t["delete-file-button-span"]}
          </span>
        </button>
      </div>
    </div>
  );
};

export default FileList;
