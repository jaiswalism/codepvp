import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";

import { autocompletion, completionKeymap } from "@codemirror/autocomplete";


import AddFileButton from "./components/AddFileButton";

import { sandpackDark } from "@codesandbox/sandpack-themes";

const PixelPvP = () => {

  return (
    <div className="h-screen w-full flex flex-col bg-[#020617]">

      <SandpackProvider
        template="react"
        theme={sandpackDark}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"]
        }}
      >

        {/* Top action bar */}
        <div className="p-2 border-b border-slate-800">
          <AddFileButton />
        </div>

        {/* IDE area */}
        <div className="flex-1 min-h-0">

          <SandpackLayout
            // style={{
            //   height: "100dvh",
            // }}
          >

            <SandpackFileExplorer
              // style={{
              //   height: "100%",
              //   background: "#020617",
              //   borderRight: "1px solid #1e293b"
              // }}
            />

            <SandpackCodeEditor
              showTabs
              showInlineErrors
              showLineNumbers
              // style={{
              //   height: "100%",
              //   background: "#020617"
              // }}

              extensions={[autocompletion()]}
              extensionsKeymap={[...completionKeymap]}
            />

            {/* Wrapper to force a desktop viewport size */}
            <div style={{ width: "100%", overflowX: "auto" }}>
              <div style={{ minWidth: "1024px", height: "100%" }}>
                <SandpackPreview 
                  style={{ height: "100dvh" }} 
                  showOpenInCodeSandbox={false} 
                />
              </div>
            </div>

          </SandpackLayout>

        </div>

      </SandpackProvider>
    </div>
  );
};

export default PixelPvP;