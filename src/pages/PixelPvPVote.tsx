import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import { useUser } from "../hooks/useUser";
import { SandpackProvider, SandpackPreview, SandpackLayout } from "@codesandbox/sandpack-react";
import { sandpackDark } from "@codesandbox/sandpack-themes";

type ShowcaseData = {
  topic: string;
  players: string[];
  playerFiles: Record<string, Record<string, string>>;
};

export default function PixelPvPVote() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { userData } = useUser();
  const currentUser = userData?.username || "";

  // Data & Progression State
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"loading" | "intro" | "preview" | "finished" | "results">("loading");

  const [leaderboard, setLeaderboard] = useState<{username: string, score: number}[] | null>(null);
  
  // Voting State
  const [timeLeft, setTimeLeft] = useState(90);
  const [currentVote, setCurrentVote] = useState<number>(0);
  const [allVotes, setAllVotes] = useState<Record<string, number>>({});

  // 1. Fetch data on mount
  useEffect(() => {
    if (!roomId) return;
    
    socket.emit("getShowcaseData", { roomId });

    const handleData = (payload: ShowcaseData) => {
      setData(payload);
      setPhase("intro"); // Start the show!
    };

    const handleResults = ({ leaderboard }: { leaderboard: {username: string, score: number}[] }) => {
        setLeaderboard(leaderboard);
        setPhase("results"); // Switch the screen to the podium!
    };

    socket.on("showcaseDataPayload", handleData);
    socket.on("frontendMatchResults", handleResults);

    return () => { 
        socket.off("showcaseDataPayload", handleData); 
        socket.off("frontendMatchResults", handleResults);
    };
  }, [roomId]);

  // 2. Handle Phase Timers (Intro -> Preview)
  useEffect(() => {
    if (phase === "intro") {
      const timer = setTimeout(() => {
        setPhase("preview");
        setTimeLeft(90); // Reset the 90s timer for the preview
        setCurrentVote(0); // Reset their slider/vote selection
      }, 3000); // Show intro for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [phase, currentIndex]);

  // 3. Handle the 90-second Preview Countdown
  useEffect(() => {
    if (phase !== "preview") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextPlayer(); // Auto-advance if time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // 4. Advance to the next player or finish
  const handleNextPlayer = () => {
    if (!data) return;
    
    const viewingPlayer = data.players[currentIndex];
    
    // Save the vote (default to 0 if they didn't vote and time ran out)
    setAllVotes(prev => ({ ...prev, [viewingPlayer]: currentVote }));

    if (currentIndex + 1 < data.players.length) {
      setCurrentIndex(prev => prev + 1);
      setPhase("intro");
    } else {
      setPhase("finished");
    }
  };

  // 5. Submit all votes to backend when finished
  useEffect(() => {
    if (phase === "finished" && roomId && currentUser) {
      socket.emit("submitVotes", { roomId, voter: currentUser, votes: allVotes });
      // Optionally navigate away after a few seconds, or wait for backend to broadcast the winner
    }
  }, [phase, roomId, currentUser, allVotes]);


  // --- RENDER STATES ---

  if (phase === "loading" || !data) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="animate-pulse tracking-widest font-mono text-sm uppercase">Loading Showcase...</p>
        </div>
      </div>
    );
  }

  const viewingPlayer = data.players[currentIndex];
  const isViewingSelf = viewingPlayer === currentUser;
  const currentFiles = data.playerFiles[viewingPlayer];

  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-slate-300">
        <h2 className="text-blue-500 font-mono tracking-widest uppercase mb-4 text-sm">Up Next</h2>
        <h1 className="text-5xl font-extrabold text-white tracking-tight">
          {isViewingSelf ? "Your Design" : `${viewingPlayer}'s Design`}
        </h1>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-slate-300">
        <h1 className="text-4xl font-extrabold text-white mb-4">Voting Complete!</h1>
        <p className="text-slate-400">Waiting for other players to finish voting...</p>
      </div>
    );
  }

  if (phase === "results" && leaderboard) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center py-20 text-slate-300">
        <h1 className="text-5xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Final Results
        </h1>
        <p className="text-slate-400 mb-12 font-mono">Topic: {data?.topic}</p>

        <div className="w-full max-w-2xl flex flex-col gap-4 px-6">
          {leaderboard.map((player, index) => {
            // Determine styling based on rank
            const isWinner = index === 0;
            const isCurrentUser = player.username === currentUser;
            
            let rankColor = "text-slate-400";
            if (index === 0) rankColor = "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"; // Gold
            if (index === 1) rankColor = "text-slate-300"; // Silver
            if (index === 2) rankColor = "text-amber-600"; // Bronze

            return (
              <div 
                key={player.username} 
                className={`flex items-center justify-between p-6 rounded-xl border ${
                  isWinner ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'bg-slate-800/50 border-slate-700'
                } ${isCurrentUser ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#020617]' : ''}`}
              >
                <div className="flex items-center gap-6">
                  <span className={`text-4xl font-black italic ${rankColor}`}>#{index + 1}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      {player.username}
                      {isCurrentUser && <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                    </h2>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-black text-white">{player.score}<span className="text-lg text-slate-500">/10</span></span>
                  <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Avg Rating</span>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => navigate("/")} // Adjust to wherever your home/queue is
          className="mt-12 bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-lg font-bold transition-all border border-slate-700 hover:border-slate-500"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  // Phase === "preview"
  return (
    <div className="h-screen w-full flex flex-col bg-[#020617] text-slate-300 overflow-hidden relative">
      
      {/* HEADER */}
      <header className="h-[60px] px-6 border-b border-slate-800 flex justify-between items-center shrink-0 bg-[#020617]/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <span className="text-blue-400 font-mono text-sm">Viewing:</span>
          <span className="text-white font-bold">{viewingPlayer}</span>
          {isViewingSelf && <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded border border-blue-500/30">YOU</span>}
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <span className="text-slate-500 text-sm">Topic:</span>
          <span className="text-slate-300 text-sm font-medium">{data.topic}</span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span className="text-slate-400 text-sm">Time Left:</span>
          <span className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </span>
        </div>
      </header>

      {/* FULLSCREEN PREVIEW (No Editor!) */}
      <div className="flex-1 w-full relative bg-white">
        
        {/* ADDED: absolute inset-0 wrapper to fix CSS percentage height resolution */}
        <div className="absolute inset-0">
          <SandpackProvider
            key={viewingPlayer} 
            template="react"
            theme={sandpackDark}
            files={currentFiles || { "/App.js": "export default function App() { return <h1>No code submitted.</h1> }" }}
            options={{ externalResources: ["https://cdn.tailwindcss.com"] }}
          >
            <SandpackLayout style={{ height: "100dvh", border: "none", borderRadius: 0 }}>
              <SandpackPreview 
                style={{ height: "100%" }} 
                showOpenInCodeSandbox={false} 
                showRefreshButton={true}
              />
            </SandpackLayout>
          </SandpackProvider>
        </div>

      </div>

      {/* VOTING FOOTER (Floating Over the Bottom) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#020617]/95 border border-slate-800 shadow-2xl backdrop-blur-xl px-8 py-4 rounded-2xl flex flex-col items-center gap-4 z-50 min-w-[400px]">
        
        {isViewingSelf ? (
          <div className="text-center py-2">
            <h3 className="text-white font-bold text-lg mb-1">This is your design!</h3>
            <p className="text-slate-400 text-sm">Sit back and relax while the others vote.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium text-slate-300">Rate this design</span>
              <span className="text-sm font-bold text-blue-400">{currentVote > 0 ? `${currentVote} / 10` : "Unrated"}</span>
            </div>
            
            {/* 1-10 Voting Buttons */}
            <div className="flex items-center gap-1.5 w-full justify-between">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setCurrentVote(num)}
                  className={`w-8 h-8 rounded-md font-mono text-sm font-bold transition-all ${
                    currentVote === num 
                      ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-110' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={handleNextPlayer}
          disabled={!isViewingSelf && currentVote === 0}
          className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all ${
            (!isViewingSelf && currentVote === 0)
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]'
          }`}
        >
          {isViewingSelf ? "Skip Your Turn" : "Submit Vote & Next"}
        </button>

      </div>

    </div>
  );
}