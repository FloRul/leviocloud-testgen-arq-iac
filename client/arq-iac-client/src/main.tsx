import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./assets/iubenda.css";
import "./assets/utilities-print.css";
import "./assets/utilities-screen.css";
import { LanguageProvider } from "./context/languages-context.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
);
