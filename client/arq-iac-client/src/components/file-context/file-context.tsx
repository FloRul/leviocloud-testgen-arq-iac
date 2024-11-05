import React, { createContext, ReactNode, useContext, useState } from "react";
import { ServerFile } from "../../utils/api-utils";

// Définir le type de contexte
interface FileContextType {
  files: ServerFile[];
  setFiles: React.Dispatch<React.SetStateAction<ServerFile[]>>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFileContext must be used within a FileProvider");
  }
  return context;
};

interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [files, setFiles] = useState<ServerFile[]>([]);

  return (
    <FileContext.Provider value={{ files, setFiles }}>
      {children}
    </FileContext.Provider>
  );
};
