import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { getLink } from "../../utils/api-utils"; // Fonction pour obtenir l'URL presignée
import { languages } from "../../utils/languages";
import { formatDate } from "../../utils/utils";

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
              {formatDate(job.created_at)}
            </div>
            <div>
              <span className="font-medium">{t["file-last-update"]}</span>
              {formatDate(job.updated_at)}
            </div>
          </div>
          <div>
            {isOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="48px"
                viewBox="0 -960 960 960"
                width="48px"
                fill="#164E63"
              >
                <path d="M480-554 283-357l-43-43 240-240 240 240-43 43-197-197Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="48px"
                viewBox="0 -960 960 960"
                width="48px"
                fill="#164E63"
              >
                <path d="M480-344 240-584l43-43 197 197 197-197 43 43-240 240Z" />
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
