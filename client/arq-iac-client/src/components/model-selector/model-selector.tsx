import { useState } from "react";
import { useLanguage } from "../../context/languages-context";
import { languages } from "../../utils/languages";

interface ModelSelectorProps {
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ setSelectedModel }) => {
  const { language } = useLanguage();
  const t = languages[language];

  const [selectedModel, setSelectedModelLocal] = useState<string>(
    "anthropic.claude-3-sonnet-20240229-v1:0"
  );

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    setSelectedModelLocal(selected); // Mettre à jour l'état local
    setSelectedModel(selected); // Informer le parent de la sélection
  };

  return (
    <div className="pf-form-field sm:col-span-6">
      <label
        className="mb-2 block text-p1 text-primary-500 transition-colors duration-200 ease-in-out"
        htmlFor="modelSelect"
        data-key="claude-model-label"
      >
        {t["claude-model-label"]}
      </label>
      <select
        id="modelSelect"
        className="w-1/4 h-10 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition duration-200 ease-in-out"
        value={selectedModel}
        onChange={handleModelChange}
      >
        {/* <option value="anthropic.claude-3-opus-20240229-v1:0">OPUS</option> */}
        <option value="anthropic.claude-3-sonnet-20240229-v1:0">SONNET</option>
        <option value="anthropic.claude-3-haiku-20240307-v1:0">HAIKU</option>
      </select>
      <span></span>
    </div>
  );
};

export default ModelSelector;
