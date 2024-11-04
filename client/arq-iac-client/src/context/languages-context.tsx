import React, { createContext, ReactNode, useContext, useState } from "react";
import { languages } from "../utils/languages"; // Chemin correct vers votre fichier languages.js

type LanguageType = "en" | "fr";

interface LanguageContextType {
  language: LanguageType;
  switchLanguage: (lang: LanguageType) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<LanguageType>("fr"); // Langue par défaut

  const switchLanguage = (lang: LanguageType) => {
    if (languages[lang]) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
