import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  defaultDark
} from "@codesandbox/sandpack-react";


import AddFileButton from "./components/AddFileButton";
import OpenPreviewButton from "./components/OpenPreviewButton";

import { cyberpunk } from "@codesandbox/sandpack-themes";

const PixelPvP = () => {

    const openPreview = () => {
        window.open("/sandpack-preview", "_blank");
    };

  return (
    <div className="h-screen w-full flex flex-col bg-[#020617]">

      <SandpackProvider
        template="react"
        theme={cyberpunk}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"]
        }}
      >

        {/* Top action bar */}
        <div className="p-2 border-b border-slate-800">
          <AddFileButton />
          <OpenPreviewButton />
        </div>

        {/* IDE area */}
        <div className="flex-1 min-h-0">

          <SandpackLayout
            style={{
              height: "100dvh",
            }}
          >

            <SandpackFileExplorer
              style={{
                height: "100%",
                background: "#020617",
                borderRight: "1px solid #1e293b"
              }}
            />

            <SandpackCodeEditor
              showTabs
              showInlineErrors
              showLineNumbers
              style={{
                height: "100%",
                background: "#020617"
              }}
            />

            <SandpackPreview
              style={{
                height: "100%",
                borderLeft: "1px solid #1e293b"
              }}
            />

          </SandpackLayout>

        </div>

      </SandpackProvider>
      <button
  onClick={openPreview}
  className="px-3 py-1 bg-green-500 rounded"
>
  Desktop Preview
</button>
    </div>
  );
};

export default PixelPvP;