import React from "react";
import logo from "../../assets/logos/logo.svg";
import { useLanguage } from "../../context/languages-context";

interface HeaderProps {
  signOut?: () => void;
}

const Header: React.FC<HeaderProps> = ({ signOut }) => {
  const { language, switchLanguage } = useLanguage();

  return (
    <header className="dark">
      <div className="absolute inset-x-0 top-0 z-20">
        <div className="w-xl max-w-full px-section mx-auto pt-4 xs:pt-6 sm:pt-8 primary">
          <div className="flex items-center py-1 mb-4 xs:mb-6 sm:mb-8">
            <a
              href="https://levio.ca/"
              className="w-[78px] h-[45px] xs:w-[123px] xs:h-[71px] shrink-0 rounded-sm inline-block transition duration-300 ease-in-out motion-safe:hover:scale-105 hover:opacity-60"
            >
              <img src={logo} alt="Accueil" />
            </a>

            <div className="mr-0 ml-auto flex items-center space-x-4 xs:space-x-6">
              <ul className="mb-0 text-center inline-block">
                <li className="mb-1 last:mb-0">
                  <button
                    id="langFr"
                    className={`group h-extend-cursor-area relative rounded-md h-8 w-9 flex justify-center items-center font-extrabold cursor-pointer ${
                      language === "fr"
                        ? "text-[rgb(0,76,95)] bg-white" // Utilisation de la couleur RGB
                        : "text-white bg-transparent"
                    }`}
                    aria-label="Français"
                    onClick={() => switchLanguage("fr")}
                  >
                    <span className="pf-button-label group-hover:bg-visible-line">
                      Fr
                    </span>
                  </button>
                </li>
                <li className="mb-1 last:mb-0">
                  <button
                    id="langEn"
                    className={`group h-extend-cursor-area relative rounded-md h-8 w-9 flex justify-center items-center font-extrabold cursor-pointer ${
                      language === "en"
                        ? "text-[rgb(0,76,95)] bg-white" // Utilisation de la couleur RGB
                        : "text-white bg-transparent"
                    }`}
                    aria-label="English"
                    onClick={() => switchLanguage("en")}
                  >
                    <span className="pf-button-label group-hover:bg-visible-line">
                      En
                    </span>
                  </button>
                </li>
              </ul>

              {/* Bouton de déconnexion */}
              <button
                onClick={signOut}
                className="text-white uppercase rounded-md h-8 flex justify-center items-center bg-black hover:bg-gray-800 transition duration-300 px-4"
                aria-label="Déconnexion"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
