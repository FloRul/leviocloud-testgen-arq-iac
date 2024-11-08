import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { deleteFiles } from "../../utils/api-utils";
import { ServerFile } from "../../utils/interfaces";
import { languages } from "../../utils/languages";
import { formatDate } from "../../utils/utils";
import { useFileContext } from "../contexts/file-context";
import FileUploader from "../file-uploader/file-uploader";
import Modal from "../modal/modal";

interface FileListProps {
  selectedFiles: Set<string>;
  handleFileSelection: (fileId: string) => void;
  handleAllFileSelection: (fileIds: string[]) => void;
}

const FileList: React.FC<FileListProps> = ({
  selectedFiles,
  handleFileSelection,
  handleAllFileSelection,
}) => {
  const { language } = useLanguage();
  const t = languages[language];

  const { setFiles: updateFiles, files: contextFiles } = useFileContext();
  const [filteredFiles, setFilteredFiles] = useState<ServerFile[]>([]);
  const [filter, setFilter] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
  };

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

  const handleSelectAll = () => {
    if (
      filteredFiles.length === 0 ||
      selectedFiles.size === filteredFiles.length
    ) {
      handleAllFileSelection([]);
    } else {
      const allFileId: string[] = [];
      filteredFiles.forEach((file) => allFileId.push(file.file_id));
      handleAllFileSelection(allFileId);
    }
  };

  const handleDelete = async () => {
    if (selectedFiles.size > 0) {
      try {
        await deleteFiles([...selectedFiles]);
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
      <label
        className="mb-2 block text-p1 text-primary-500 transition-colors duration-200 ease-in-out"
        htmlFor="modelSelect"
        data-key="claude-model-label"
      >
        1 - {t["claude-files-label"]}
        <span className="text-red-700">*</span>
      </label>
      <div className="flex items-center mb-2">
        <input
          type="text"
          placeholder={t["search-files"]}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input w-6/12 rounded-lg mb-2"
        />
        <div className="flex space-x-2 ml-auto">
          <button
            type="button"
            onClick={openModal}
            className="rounded-md bg-cyan-900 p-2.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow-lg focus:bg-green-500 focus:shadow-none active:bg-green-500 hover:bg-green-500 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none mr-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e8eaed"
            >
              <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
            </svg>
          </button>
          <button
            id="deleteButton"
            type="button"
            className="rounded-md bg-cyan-900 p-2.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow-lg focus:bg-green-500 focus:shadow-none active:bg-green-500 hover:bg-green-500 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            onClick={handleDelete}
          >
            <span className="relative" data-key="delete-files-button-span">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e8eaed"
              >
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
              </svg>
            </span>
          </button>
        </div>
      </div>

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
            <th className="border border-gray-300 px-4 py-2 text-left bg-gray-200 w-9/12">
              {t["file-name"]}
            </th>
            <th className="border border-gray-300 px-4 py-2 text-left bg-gray-200 w-2/12">
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
    </div>
  );
};

export default FileList;
