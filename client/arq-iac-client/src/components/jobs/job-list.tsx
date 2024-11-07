import React, { useEffect, useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { getJobs } from "../../utils/api-utils";
import { Job } from "../../utils/interfaces";
import { languages } from "../../utils/languages";
import JobItem from "./job-item";

const JobList: React.FC = () => {
  const { language } = useLanguage();
  const t = languages[language];

  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const loadJobs = async () => {
    try {
      const jobData = await getJobs();
      setJobs(jobData);
      setFilteredJobs(jobData);
    } catch (error) {
      console.error("Erreur lors de la récupération des jobs", error);
      setError("Erreur lors du chargement des jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (searchQuery === "") {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(
        jobs.filter(
          (job) =>
            job.job_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.job_status.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, jobs]);

  const indexOfLastJob = currentPage * itemsPerPage;
  const indexOfFirstJob = indexOfLastJob - itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleSearch = () => {
    setLoading(true);
    loadJobs();
  };

  if (loading) {
    return <div>{t["loading-jobs"]}</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  return (
    <div className="file-list pf-form-field sm:col-span-6">
      <h2>{t["list-of-jobs"]}</h2>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder={t["search-jobs-placeholder"]}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input w-4/12 mr-2"
        />
      </div>

      {currentJobs.length > 0 ? (
        currentJobs.map((job) => <JobItem key={job.job_id} job={job} />)
      ) : (
        <div>{t["no-jobs-found"]}</div>
      )}

      {/* Button refresh centered */}
      <div className="flex justify-center mt-4">
        <button
          type="button"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          onClick={handleSearch}
        >
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 5h12m0 0L9 1m4 4L9 9"
            />
          </svg>
          <span className="sr-only">{t["refresh-search"]}</span>
        </button>
      </div>

      {/* Pagination - Only show if there is more than 1 page */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mb-4 mt-4">
          <nav aria-label="Page navigation example">
            <ul className="inline-flex -space-x-px text-sm">
              <li>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  {t["previous"]}
                </button>
              </li>

              {/* Dynamically generate page buttons */}
              {pageNumbers.map((number) => (
                <li key={number}>
                  <button
                    onClick={() => paginate(number)}
                    className={`flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${
                      number === currentPage
                        ? "text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:bg-gray-700 dark:text-white"
                        : ""
                    }`}
                  >
                    {number}
                  </button>
                </li>
              ))}

              <li>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  {t["next"]}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default JobList;
