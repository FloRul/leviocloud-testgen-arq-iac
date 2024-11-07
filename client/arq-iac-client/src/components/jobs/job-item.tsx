import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { getLink } from "../../utils/api-utils"; // Fonction pour obtenir l'URL presignée
import { languages } from "../../utils/languages";

interface Job {
  job_id: string;
  job_error: string;
  job_status: string;
  created_at: number;
  updated_at: number;
  input_files: {
    filename: string;
    file_id: string;
  }[];
  prompt: string;
}

interface JobItemProps {
  job: Job;
}

const JobItem: React.FC<JobItemProps> = ({ job }) => {
  const { language } = useLanguage();
  const t = languages[language];
  const [fileLinks, setFileLinks] = useState<Record<string, string>>({});
  const [loadingLinks, setLoadingLinks] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchFileLinks = async () => {
      setLoadingLinks(true);

      const links: Record<string, string> = {};
      for (const file of job.input_files) {
        try {
          const link = await getLink(job.job_id, file.file_id);
          links[file.file_id] = link;
        } catch (error) {
          console.error("Failed to fetch link for file:", file.filename);
        }
      }

      setFileLinks(links);
      setLoadingLinks(false);
    };

    if (job.job_status === "COMPLETED") {
      fetchFileLinks();
    }
  }, [job.job_id, job.job_status, job.input_files]);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="job-accordion-item mb-4 border-b">
      <div
        className="job-summary p-4 cursor-pointer bg-gray-100 rounded-md"
        onClick={toggleAccordion}
      >
        <div className="flex justify-between">
          <h3 className="font-semibold">
            {job.prompt.length > 40
              ? job.prompt.substring(0, 40) + "..."
              : job.prompt}
          </h3>
          <div className="text-sm">
            <span className="font-medium">{t["status"]}</span>
            {job.job_status}
          </div>
        </div>
        <div className="flex justify-between">
          <div className="text-sm mt-2">
            <div>
              <span className="font-medium">{t["created-at"]}</span>
              {new Date(job.created_at * 1000).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">{t["file-last-update"]}</span>
              {new Date(job.updated_at * 1000).toLocaleString()}
            </div>
          </div>
          <div>
            {isOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="48px"
                viewBox="0 -960 960 960"
                width="48px"
                fill="#000000"
              >
                <path d="M450-332h60v-182l74 74 42-42-146-146-146 146 42 42 74-74v182Zm30 252q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="48px"
                viewBox="0 -960 960 960"
                width="48px"
                fill="#000000"
              >
                <path d="m480-332 146-146-42-42-74 74v-182h-60v182l-74-74-42 42 146 146Zm0 252q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-60q142 0 241-99.5T820-480q0-142-99-241t-241-99q-141 0-240.5 99T140-480q0 141 99.5 240.5T480-140Zm0-340Z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="job-details p-4 bg-gray-50">
          <div className="text-sm">
            <strong>{t["prompt"]}</strong> {job.prompt}
          </div>

          <div className="mt-4 text-sm">
            <strong>{t["files"]}</strong>
            <ul>
              {job.input_files.map((file) => (
                <li key={file.file_id} className="mb-2">
                  {loadingLinks ? (
                    <span>{t["loading-span"]}</span>
                  ) : fileLinks[file.file_id] ? (
                    <a
                      href={fileLinks[file.file_id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 underline"
                    >
                      {file.filename}
                    </a>
                  ) : (
                    <span>
                      {file.filename} ({t["link-not-available"]})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobItem;
