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
          <h3 className="font-semibold">{job.prompt}</h3>
          <div className="text-sm">
            <span className="font-medium">{t["status"]}</span>
            {job.job_status}
          </div>
        </div>
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
      </div>

      {isOpen && (
        <div className="job-details p-4 bg-gray-50">
          <div>
            <strong>{t["prompt-label"]}</strong> {job.prompt}
          </div>

          <div className="mt-4">
            <strong>Files:</strong>
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
                      className="text-blue-500 hover:text-blue-700"
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
