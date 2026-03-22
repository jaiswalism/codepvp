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
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import { useUser } from "../hooks/useUser";
import AddFileButton from "./components/AddFileButton";
import { sandpackDark } from "@codesandbox/sandpack-themes";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useFrontendTimer } from "../hooks/useFrontendTimer";

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
  const { timeLeft, isMatchOver } = useFrontendTimer(roomId);
  const { sandpack } = useSandpack();
  const { code } = useActiveCode();
  const navigate = useNavigate();

  const [topic, setTopic] = useState("Loading objective...");

  const sandpackRef = useRef(sandpack);
  const lastSyncedFilesRef = useRef<string>("");

  const activeFileRef = useRef<string>(sandpack.activeFile || "/App.js");
  const filesRef = useRef(sandpack.files);
  const suppressUntilRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);

  // --- NEW: Custom Drag Logic for the Editor Height ---
  // Defaults to exactly 50% of the user's screen height
  const [editorHeight, setEditorHeight] = useState(() => window.innerHeight * 0.5);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isMatchOver) {
      // Give them a 3-second breather to see "00:00" before pulling them away
      const redirectTimer = setTimeout(() => {
        navigate(`/PixelPvP/vote/${roomId}`);
      }, 3000);

      return () => clearTimeout(redirectTimer);
    }
  }, [isMatchOver, navigate, roomId]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      // Calculate height based on mouse position, minus the 60px header
      // Clamped to a minimum of 100px so it doesn't vanish entirely
      const newHeight = Math.max(100, e.pageY - 60);
      setEditorHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = ''; // Reset cursor back to normal
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  // --------------------------------------------------

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

    const handleRoomState = (data: { files?: Record<string, string>, topic?: string }) => {
      if (data.topic) setTopic(data.topic);

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
      {/* 1. HEADER (Sticky at the very top) */}
      <header className="sticky top-0 z-50 h-[60px] px-6 border-b border-slate-800 flex justify-between items-center bg-[#020617]">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            PixelPvP
          </h1>
          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
          <AddFileButton />
        </div>

        {/* CENTER: THE OBJECTIVE (Absolute positioned to stay perfectly centered) */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center pointer-events-none">
          <div className="bg-slate-800/60 px-5 py-1.5 rounded-full border border-slate-700 shadow-sm flex items-center gap-2 backdrop-blur-sm">
            <span className="text-blue-400 text-sm font-bold tracking-wide">OBJECTIVE:</span>
            <span className="text-slate-100 text-sm font-medium">{topic}</span>
          </div>
        </div>

        {/* Right Side: Timer & Submit Button */}
        <div className="flex items-center gap-4">
          
          {/* THE TIMER UI */}
          <div className={`flex items-center gap-3 px-5 py-1.5 rounded-full border ${isMatchOver ? 'bg-red-950/30 border-red-900' : 'bg-slate-800/50 border-slate-700 shadow-inner'}`}>
            {!isMatchOver && (
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            )}
            <span className={`font-mono text-lg font-bold tracking-wider ${isMatchOver ? 'text-red-500' : 'text-slate-100'}`}>
              {timeLeft}
            </span>
          </div>

          {/* SUBMIT BUTTON */}
          <button 
            disabled={isMatchOver}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-5 py-1.5 rounded-md font-semibold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
          >
            Submit
          </button>
          
        </div> 
      </header>

      {/* 2. IDE AREA (Height driven by our custom drag state!) */}
      <div className="w-full relative bg-[#020617]" style={{ height: `${editorHeight}px` }}>
        <SandpackLayout style={{ height: "100%", border: "none", borderRadius: 0, backgroundColor: "transparent" }}>
          
          {/* Inner horizontal split for Files vs Editor remains intact */}
          <Group orientation="horizontal" className="h-full w-full">
            <Panel defaultSize={20} minSize={10}>
              <div className="h-full w-full bg-[#020617]">
                <SandpackFileExplorer style={{ height: "100%", background: "transparent" }} />
              </div>
            </Panel>

            <Separator className="w-1.5 bg-[#1e293b] hover:bg-blue-500 transition-colors cursor-col-resize flex flex-col items-center justify-center group z-20">
              <div className="h-8 w-1 bg-slate-500 group-hover:bg-white rounded-full transition-colors pointer-events-none" />
            </Separator>

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

      {/* 3. THE CUSTOM DRAG HANDLE (Slider) */}
      <div 
        onMouseDown={(e) => {
          e.preventDefault(); // Prevents annoying text highlighting while dragging
          isDragging.current = true;
          document.body.style.cursor = 'row-resize'; // Forces cursor change across whole screen
        }}
        className="h-2 w-full bg-[#1e293b] hover:bg-blue-500 transition-colors cursor-row-resize flex items-center justify-center relative z-40"
      >
        <div className="w-8 h-1 bg-slate-500 rounded-full pointer-events-none" />
      </div>

      {/* 4. PREVIEW AREA (Locks into place upon scrolling down) */}
      <div className="w-full bg-white flex flex-col sticky top-[60px] z-10 shadow-2xl" style={{ height: "calc(100dvh - 60px)" }}>
        
        <div className="w-full h-[40px] bg-slate-900 border-b border-slate-800 flex items-center px-6 shrink-0 z-20">
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