import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  useSandpack,
  useActiveCode,
} from "@codesandbox/sandpack-react";

import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { socket } from "../utils/socket";
import { useUser } from "../hooks/useUser";


import AddFileButton from "./components/AddFileButton";

import { sandpackDark } from "@codesandbox/sandpack-themes";

const PixelPvP = () => {
  const [searchParams] = useSearchParams();
  const { userData } = useUser();

  const roomId = searchParams.get("roomId") || "";
  const username = userData?.username || "";

  return (
    <div className="h-screen w-full flex flex-col bg-[#020617]">

      <SandpackProvider
        template="react"
        theme={sandpackDark}
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
  roomId: string;
  username: string;
};

function PixelRoomSync({ roomId, username }: PixelRoomSyncProps) {
  const { sandpack } = useSandpack();
  const { code } = useActiveCode();

  const activeFileRef = useRef<string>(sandpack.activeFile || "/App.js");
  const filesRef = useRef(sandpack.files);
  const suppressUntilRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    activeFileRef.current = sandpack.activeFile || "/App.js";
  }, [sandpack.activeFile]);

  useEffect(() => {
    filesRef.current = sandpack.files;
  }, [sandpack.files]);

  useEffect(() => {
    if (!roomId || !username) return;

    socket.emit("registerUser", { username });
    socket.emit("joinFrontendRoom", { roomId, username });

    const handleRoomState = (data: { files?: Record<string, string> }) => {
      if (!data?.files) return;

      suppressUntilRef.current = Date.now() + 350;
      Object.entries(data.files).forEach(([path, code]) => {
        sandpack.updateFile(path, code, false);
      });
    };

    socket.on("frontendRoomState", handleRoomState);

    return () => {
      socket.off("frontendRoomState", handleRoomState);
    };
  }, [roomId, sandpack, username]);

  useEffect(() => {
    if (!roomId || !username) return;

    const intervalId = window.setInterval(() => {
      socket.emit("frontendFilesSync", {
        roomId,
        username,
        files: normalizeFiles(filesRef.current),
      });
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