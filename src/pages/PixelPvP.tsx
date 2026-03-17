import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  useSandpack,
  useActiveCode,
} from "@codesandbox/sandpack-react";

import "../App.css";

import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { socket } from "../utils/socket";
import { useUser } from "../hooks/useUser";


import AddFileButton from "./components/AddFileButton";

import { sandpackDark } from "@codesandbox/sandpack-themes";

import { Group, Panel, Separator } from "react-resizable-panels";

const PixelPvP = () => {

  const { userData } = useUser();

  const { roomId } = useParams();

  const username = userData?.username || "";

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#020617] text-slate-300 ">

      <SandpackProvider
        template="react"
        theme={{
          ...sandpackDark,
          colors: {
            ...sandpackDark.colors,
            surface1: "#020617", // Tailwind slate-950
            surface2: "#0f172a", // Tailwind slate-900 for active tabs
            surface3: "#1e293b", // Tailwind slate-800 for hovers
          },
          font: {
            body: 'Inter, system-ui, sans-serif',
            mono: 'Fira Code, monospace',
            size: '14px',
          }
        }}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"]
        }}
      >
        <PixelRoomSync roomId={roomId} username={username} />

      </SandpackProvider>
    </div>
  );
};

type PixelRoomSyncProps = {
  roomId: string | undefined;
  username: string;
};

function PixelRoomSync({ roomId, username }: PixelRoomSyncProps) {
  const { sandpack } = useSandpack();
  const { code } = useActiveCode();

  const sandpackRef = useRef(sandpack);
  const lastSyncedFilesRef = useRef<string>("");

  const activeFileRef = useRef<string>(sandpack.activeFile || "/App.js");
  const filesRef = useRef(sandpack.files);
  const suppressUntilRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    sandpackRef.current = sandpack;
  }, [sandpack]);

  useEffect(() => {
    activeFileRef.current = sandpack.activeFile || "/App.js";
  }, [sandpack.activeFile]);

  useEffect(() => {
    filesRef.current = sandpack.files;
  }, [sandpack.files]);

  useEffect(() => {
    if (!roomId || !username) return;

    socket.emit("joinFrontendRoom", { roomId, username });

    const handleRoomState = (data: { files?: Record<string, string> }) => {
      if (!data?.files) return;

      suppressUntilRef.current = Date.now() + 350;
      Object.entries(data.files).forEach(([path, code]) => {
        sandpackRef.current.updateFile(path, code, false);
      });
    };

    socket.on("frontendRoomState", handleRoomState);

    return () => {
      socket.off("frontendRoomState", handleRoomState);
    };
  }, [roomId, username]);

  useEffect(() => {
    if (!roomId || !username) return;

    const intervalId = window.setInterval(() => {

      const currentFiles = normalizeFiles(filesRef.current);
      const currentFilesString = JSON.stringify(currentFiles);

      if (currentFilesString !== lastSyncedFilesRef.current) {
        socket.emit("frontendFilesSync", {
          roomId,
          username,
          files: currentFiles,
        });
        
        // Update the ref so we don't send it again until it changes
        lastSyncedFilesRef.current = currentFilesString;
      }

    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [roomId, username]);

  useEffect(() => {
    if (!roomId || !username) return;
    if (Date.now() < suppressUntilRef.current) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      socket.emit("frontendCodeChange", {
        roomId,
        username,
        path: activeFileRef.current || "/App.js",
        code,
      });
    }, 180);
  }, [code, roomId, username]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* 1. HEADER (Made sticky so it stays at the top when scrolling) */}
      <header className="sticky top-0 z-50 h-[60px] px-6 border-b border-slate-800 flex justify-between items-center bg-[#020617]">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            PixelPvP
          </h1>
          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
          <AddFileButton />
        </div>
        <div></div> 
      </header>

      {/* 2. IDE AREA (Takes exactly one screen height minus the header) */}
      <div className="w-full relative border-b-4 border-slate-900" style={{ height: "calc(100vh - 60px)" }}>
        <SandpackLayout style={{ height: "100%", border: "none", borderRadius: 0, backgroundColor: "transparent" }}>
          
          <Group orientation="horizontal" className="h-full w-full">
            
            {/* COLUMN 1: File Explorer */}
            <Panel defaultSize={20} minSize={10}>
              <div className="h-full w-full bg-[#020617]">
                <SandpackFileExplorer style={{ height: "100%", background: "transparent" }} />
              </div>
            </Panel>

            {/* DRAG HANDLE: Resizes Files vs Editor */}
            <Separator className="w-1.5 bg-[#1e293b] hover:bg-blue-500 transition-colors cursor-col-resize flex flex-col items-center justify-center group z-20">
              <div className="h-8 w-1 bg-slate-500 group-hover:bg-white rounded-full transition-colors" />
            </Separator>

            {/* COLUMN 2: Code Editor */}
            <Panel defaultSize={80} minSize={30}>
              <div className="h-full w-full bg-[#020617]">
                <SandpackCodeEditor
                  showTabs
                  showInlineErrors
                  showLineNumbers
                  closableTabs
                  style={{ height: "100%", background: "transparent" }}
                />
              </div>
            </Panel>

          </Group>
          
        </SandpackLayout>
      </div>

      {/* 3. PREVIEW AREA (Forces a full 100dvh scroll down) */}
      <div className="w-full bg-white relative flex flex-col" style={{ height: "100dvh" }}>
        {/* Optional: A small sub-header just for the preview window */}
        <div className="w-full h-[40px] bg-slate-900 border-b border-slate-800 flex items-center px-6 shrink-0 z-10 sticky top-[60px]">
          <span className="text-xs text-slate-400 font-mono tracking-wider uppercase font-semibold">
            Live Browser Output
          </span>
        </div>
        
        <div className="flex-1 w-full relative">
          <SandpackLayout style={{ height: "100%", border: "none", borderRadius: 0 }}>
            <SandpackPreview 
              style={{ height: "100%" }} 
              showOpenInCodeSandbox={false} 
              showRefreshButton={true}
            />
          </SandpackLayout>
        </div>
      </div>
    </>
  );
}

function normalizeFiles(files: Record<string, string | { code: string }>) {
  const out: Record<string, string> = {};

  Object.entries(files).forEach(([path, value]) => {
    if (typeof value === "string") {
      out[path] = value;
      return;
    }

    if (value && typeof value === "object" && typeof value.code === "string") {
      out[path] = value.code;
    }
  });

  return out;
}

export default PixelPvP;