import type { WithAuthenticatorProps } from "@aws-amplify/ui-react";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import config from "./amplify-configuration";
import ClaudeForm from "./components/claude-form/claude-form";
import { FileProvider } from "./components/contexts/file-context";
import { JobProvider } from "./components/contexts/job-context";
import Header from "./components/header/header";
import JobList from "./components/jobs/job-list";
Amplify.configure(config);

export function App({ signOut }: WithAuthenticatorProps) {
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
          <JobProvider>
            <div className="max-w-full w-xl px-section mx-auto my-16 md:my-20">
              <div className="xs:bg-white xs:rounded-3xl xs:p-16">
                <div className="pf-form-section pt-10 first:pt-0">
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-6">
                    <FileProvider>
                      <ClaudeForm />
                    </FileProvider>
                  </div>
                </div>
              </div>
            </div>
            <div className="max-w-full w-xl px-section mx-auto my-16 md:my-20">
              <div className="xs:bg-white xs:rounded-3xl xs:p-16">
                <div className="pf-form-section pt-10 first:pt-0">
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-6">
                    <JobList />
                  </div>
                </div>
              </div>
            </div>
          </JobProvider>
        </div>
        <div className="h-section-extension bg-grey-200 rounded-b-section relative z-10 -mb-section-extension"></div>
      </main>
    </>
  );
}

export default withAuthenticator(App);
