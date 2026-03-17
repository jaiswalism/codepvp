import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";

import { useParams } from "react-router-dom";
import { useFrontendTimer } from "../hooks/useFrontendTimer";

import { autocompletion, completionKeymap } from "@codemirror/autocomplete";


import AddFileButton from "./components/AddFileButton";

import { sandpackDark } from "@codesandbox/sandpack-themes";

const PixelPvP = () => {

  const { roomId } = useParams();
  const { timeLeft, isMatchOver } = useFrontendTimer(roomId);

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
          <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 px-4 py-1.5 rounded-md">
            {!isMatchOver && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
            <span className="text-white font-mono text-lg font-bold tracking-wider">
              {timeLeft}
            </span>
          </div>
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