import type { WithAuthenticatorProps } from "@aws-amplify/ui-react";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import config from "./amplifyconfiguration.json";
import FileList from "./components/file-list/file-list";
import FileUploader from "./components/file-uploader/file-uploader";
import Header from "./components/header/header";
import ModelSelector from "./components/model-selector/model-selector";
Amplify.configure(config);

export function App({ signOut, user }: WithAuthenticatorProps) {
  console.log({ user });
  return (
    <>
      <Header signOut={signOut} />

      <main id="main" data-search="content">
        <div className="heading h-include-margin dark bg-gradient-radial from-secondary-500 via-primary-500 to-primary-500 relative z-10 rounded-b-section overflow-hidden -mb-section-extension">
          <div className="absolute inset-0 pointer-events-none">
            <div className="pf-image h-full absolute inset-0">
              <div className="relative overflow-hidden h-[550px] xs:h-[650px] sm:h-[750px] md:h-[850px] w-full"></div>
            </div>
          </div>

          <div className="relative">
            <div className="pt-top-bar pb-12 lg:pb-top-bar">
              <div className="px-section text-center flex flex-col justify-center items-center w-sm max-w-full mx-auto"></div>
            </div>
          </div>
        </div>

        <div className="bg-grey-200 h-include-margin pt-section-extension sm:-mb-8 md:-mb-20">
          <div className="max-w-full w-xl px-section mx-auto my-8 md:my-12">
            <div className="pf-title-separator mb-12 mt-16 sm:mb-16 sm:mt-24 pb-3 border-b border-secondary-500">
              <div className="max-w-screen-lg h-remove-margin">
                <h2
                  className="text-h3 uppercase font-display font-semibold tracking-[0.3em] mb-6 mt-0"
                  data-key="main-title"
                >
                  IA générative
                </h2>
              </div>
            </div>
          </div>
          <div className="max-w-full w-xl px-section mx-auto my-16 md:my-20">
            <div className="xs:bg-white xs:rounded-3xl xs:p-16">
              <div className="pf-form-section pt-10 first:pt-0">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-6">
                  <ModelSelector />

                  <FileUploader />

                  <FileList files={[]} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-section-extension bg-grey-200 rounded-b-section relative z-10 -mb-section-extension"></div>
      </main>
    </>
  );
}

export default withAuthenticator(App);
