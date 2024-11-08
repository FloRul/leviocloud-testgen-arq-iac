import React from "react";
import { useLanguage } from "../../context/languages-context";
import { languages } from "../../utils/languages";

interface PromptInputProps {
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt }) => {
  const { language } = useLanguage();
  const t = languages[language];
  return (
    <div className="pf-form-field sm:col-span-6">
      <label
        className="mb-2 block text-p1 text-primary-500 transition-colors duration-200 ease-in-out"
        htmlFor="prompt"
        data-key="prompt-label"
      >
        2 - {t["prompt-label"]}
        <span className="text-red-700">*</span>
      </label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder=" Entrez votre prompt ici..."
        className="input-text rounded-lg flex-1 block w-full min-w-0 "
      />
    </div>
  );
};

export default PromptInput;
