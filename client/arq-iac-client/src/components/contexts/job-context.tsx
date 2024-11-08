// job-context.tsx
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getJobs } from "../../utils/api-utils";
import { Job } from "../../utils/interfaces";

// Crée un contexte pour les jobs
interface JobContextType {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  loadJobs: (reload?: boolean) => Promise<void>;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

interface JobProviderProps {
  children: ReactNode;
}

// Provider pour envelopper l'application avec ce contexte
export const JobProvider: React.FC<JobProviderProps> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadJobs = async (reload = false) => {
    if ((jobs.length === 0 && !isLoading) || reload) {
      setIsLoading(true);
      try {
        const jobData = await getJobs();
        setJobs(jobData);
      } catch (error) {
        console.error("Erreur lors de la récupération des jobs", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadJobs();
  }, [jobs]);

  return (
    <JobContext.Provider value={{ jobs, setJobs, loadJobs }}>
      {children}
    </JobContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte des jobs
export const useJobContext = (): JobContextType => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error("useJobContext must be used within a JobProvider");
  }
  return context;
};
