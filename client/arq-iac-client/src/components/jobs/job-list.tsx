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
      <h1 className="mb-10">{t["list-of-jobs"]}</h1>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder={t["search-jobs-placeholder"]}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input w-6/12 mr-2 rounded-lg"
        />
        <div className="flex space-x-2 ml-auto">
          {totalPages > 1 && (
            <div className="flex justify-between items-center mb-4 mt-4">
              <nav aria-label="Page navigation example">
                <ul className="inline-flex -space-x-px text-sm">
                  <li>
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center justify-center px-3 h-8 leading-tight text-gray-300 bg-white border border-e-0 border-gray-100 rounded-s-lg hover:bg-gray-100 hover:text-gray-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-500 dark:hover:text-white"
                    >
                      {t["previous"]}
                    </button>
                  </li>

                  {pageNumbers.map((number) => (
                    <li key={number}>
                      <button
                        onClick={() => paginate(number)}
                        className={`flex items-center justify-center px-3 h-8 leading-tight text-gray-300 bg-white border border-gray-100 hover:bg-gray-100 hover:text-gray-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-500 dark:hover:text-white ${
                          number === currentPage
                            ? "text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:bg-gray-500 dark:text-white"
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
                      className="flex items-center justify-center px-3 h-8 leading-tight text-gray-300 bg-white border border-gray-100 rounded-e-lg hover:bg-gray-100 hover:text-gray-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-500 dark:hover:text-white"
                    >
                      {t["next"]}
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {currentJobs.length > 0 ? (
        currentJobs.map((job) => <JobItem key={job.job_id} job={job} />)
      ) : (
        <div>{t["no-jobs-found"]}</div>
      )}

      <div className="flex justify-center mt-4">
        <button
          type="button"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          onClick={handleSearch}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e8eaed"
          >
            <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
          </svg>
          <span className="sr-only">{t["refresh-search"]}</span>
        </button>
      </div>
    </div>
  );
};

export default JobList;