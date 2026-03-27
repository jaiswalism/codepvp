import React, { useEffect, useRef, useState, useMemo } from 'react';
import Editor from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { socket } from '../utils/socket';
import { useUser } from '../hooks/useUser';
import { debounce } from 'lodash';
import { OrbitProgress } from 'react-loading-indicators';
import { markTeamSolved } from './Problemset';
import { useMatchTimer } from '../hooks/useMatchTimer';
import ChatBox from './components/chat-box';
import { LANGUAGES } from '../utils/languageTemplate'

// Problem Data schema stored in firebase
export interface ProblemData {
  constraints?: string;
  difficulty: string;
  hiddenTestCases: {
    input: string;
    output: string;
  }[];
  inputFormat?: string;
  outputFormat?: string;
  samples: {
    input: string;
    output: string;
  }[];
  statement: string;
  tags?: string[];
  title: string;
  statusA: number;
  statusB: number;
  buggyTemplateByLanguage?: Record<string, string>;
}

// Testcase interface for validating test cases
interface TestCases {
 input: string;
 expected: string;
 output: string;
 hidden: boolean;
 verdict: string;
 error: boolean;
 errorMessage: string;
}

// Mapping monaco languageId to Judge0 languageId
const languageIdMap = {
 python: 71,
 cpp: 54,
 java: 62,
 javascript: 63,
 typescript: 74,
 go: 60,
 rust: 73
} as const;

type Language = keyof typeof languageIdMap;
const DEBUG_LANGUAGE: Language = "cpp";

const Problem: React.FC = () => {

  const { problemId } = useParams<{ problemId: string }>();
  const { roomId, teamId } = useParams<{ roomId: string, teamId: string }>();

  const [data, setData] = useState<ProblemData | null>(null);
//  const [passData, setPassData] = useState<gameRes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>("python");
  const [roomMode, setRoomMode] = useState<'normal' | 'debug'>('normal');

  const { user } = useUser();
  const currentUserName = user?.displayName || user?.email || "Anon";

  const [code, setCode] = useState("");

  const [testResults, setTestResults] = useState<TestCases[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const testResultsRef = useRef<HTMLDivElement | null>(null);

  const [opponents, setOpponents] = useState<any[]>([]);

  // Generate unique localStorage key for this problem
  const storageKey = `code_${roomId}_${problemId}_${teamId}_${language}`;

  const navigate = useNavigate();

  const { timeLeft, isMatchOver } = useMatchTimer(roomId);
//   const hasAutoSubmitted = useRef(false);

  	const handleLangChange = (event: any) => {
      if (roomMode === 'debug') return;
		const newLanguage = event.target.value as Language;
   		setLanguage(newLanguage)

		const newStorageKey = `code_${roomId}_${problemId}_${teamId}_${newLanguage}`;

		// Load saved code from localStorage on mount
		const savedCode = localStorage.getItem(newStorageKey);
		if (savedCode) {
			setCode(savedCode);
		} else {
      setCode(LANGUAGES[newLanguage].template)
		}
  	}

  // --- Collaborative Editing: Prevent remote overwrite of local typing ---
  const isLocalChange = useRef(false);
  const sendChange = useMemo(() =>
   debounce((newValue: string) => {
    socket?.emit("editorChange", { roomId, teamId, problemId, code: newValue, source: currentUserName });
    isLocalChange.current = false; // After sending, reset
   }, 1000),
   [socket, roomId, teamId, problemId, currentUserName]
  );

  function handleEditorChange(newValue: string | undefined) {
   const codeValue = newValue || "";
   setCode(codeValue);
   // Save to localStorage for persistence on refresh
   localStorage.setItem(storageKey, codeValue);
   isLocalChange.current = true;
   sendChange(codeValue);
  }

  // Lock Screen
  useEffect(() => {
    const enterFullscreen = async () => {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    };

    enterFullscreen();
  }, []);

  useEffect(() => {
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          alert("You exited fullscreen. Match will end.");
        }
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);

      return () => {
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
      };
    }, [roomId, teamId]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert("You switched tabs. Match will end.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [roomId, teamId]);

  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    const preventCopy = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("copy", preventCopy);

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("copy", preventCopy);
    };
  }, []);



  // Fetch problem data & opponents
  useEffect(() => {
    if (!roomId || !problemId) return;

    const loadProblemAndOpponents = async () => {
      // --- Existing Problem Logic ---
      const roomRef = doc(db, "rooms", roomId);
      const roomSnap = await getDoc(roomRef);
      const mode = roomSnap.exists() && roomSnap.data().mode === 'debug' ? 'debug' : 'normal';
      setRoomMode(mode);

      const effectiveLanguage: Language = mode === 'debug' ? DEBUG_LANGUAGE : language;
      if (mode === 'debug' && language !== DEBUG_LANGUAGE) {
        setLanguage(DEBUG_LANGUAGE);
      }

      const collectionName = mode === 'debug' ? 'DebugProblems' : 'ProblemsWithHTC';
      const problemDoc = await getDocumentData(collectionName, problemId);

      const modeStorageKey = `code_${roomId}_${problemId}_${teamId}_${effectiveLanguage}`;
      const savedCode = localStorage.getItem(modeStorageKey);
      if (savedCode) {
        setCode(savedCode);
      } else {
        const debugStarter = mode === 'debug'
          ? problemDoc?.buggyTemplateByLanguage?.[DEBUG_LANGUAGE]
          : undefined;
        setCode(debugStarter || LANGUAGES[effectiveLanguage].template);
      }

      // --- NEW: Fetch Opponent Data & Ratings ---
      try {
        const roomSetRef = doc(db, "RoomSet", roomId);
        const roomSetSnap = await getDoc(roomSetRef);
        
        if (roomSetSnap.exists()) {
          const rsData = roomSetSnap.data();
          const oppTeamKey = teamId === 'A' ? 'teamB' : 'teamA';
          const rawOpponents = rsData[oppTeamKey]?.players || [];

          const enrichedOpponents = await Promise.all(
            rawOpponents.map(async (opp: any) => {
              try {
                const q = query(collection(db, "users"), where("username", "==", opp.pid));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                  return { ...opp, rating: querySnapshot.docs[0].data().rating };
                }
              } catch (error) {
                console.error("Failed to fetch user rating:", error);
              }
              return opp;
            })
          );

          setOpponents(enrichedOpponents);
        }
      } catch (err) {
        console.error("Failed to fetch opponents:", err);
      }
    };

    loadProblemAndOpponents();
  }, [roomId, problemId, teamId, language]);

  // Socket Connection
  useEffect(() => {

    if(!roomId || !problemId) return;

    socket.emit("joinProblemRoom", { roomId, teamId, problemId, username: currentUserName });

  }, [roomId, problemId, currentUserName]);

  // Listening changes on editor (ignore remote if local typing)
  useEffect(() => {
    if (!socket) return;

    const handleRemoteChange = (data: { code: string; source: string }) => {
      if (data.source === currentUserName) return;
      if (isLocalChange.current) return; // Don't overwrite local typing

      const editor = editorRef.current;
      const model = editor?.getModel();
      if (model && model.getValue() !== data.code) {
       const fullRange = model.getFullModelRange();
       model.pushEditOperations([], [{ range: fullRange, text: data.code }], () => null);
       // Also update localStorage when receiving remote changes
       localStorage.setItem(storageKey, data.code);
       setCode(data.code);
      }
    };

    socket.on("editorUpdate", handleRemoteChange);

    return () => {
      socket.off("editorUpdate", handleRemoteChange);
    };
  }, [socket, currentUserName, storageKey]);

  // Flush debounce on unmount to avoid losing unsent changes
  useEffect(() => {
   return () => {
    sendChange.flush && sendChange.flush();
   };
  }, [sendChange]);

  // Clear localStorage when navigating back to problemset or when component unmounts
  useEffect(() => {
   return () => {
    // Optional: Clear code on unmount (comment out if you want to keep code even after navigation)
    // localStorage.removeItem(storageKey);
   };
  }, [storageKey]);

  async function getDocumentData(collectionName: string, documentId: string) {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()) {
      const problemData = docSnap.data() as ProblemData;
      setData(problemData);
      return problemData;
    } else {
      console.log("GAY"); // This should not be removed from the code(or else)
      return null;
    }
  }

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    function handleEditorDidMount(editorInstance: editor.IStandaloneCodeEditor) {
        editorRef.current = editorInstance;
    }

    // Handles Code Submission
    const handleSubmit = async () => {
      setIsLoading(true);
      const sourceCode = editorRef.current?.getValue();
      if(sourceCode === ""){ 
        setIsLoading(false)
        return
      }
      const normalizedCode = sourceCode?.replace(/\r\n/g, "\n") || "";

      try {

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/submit`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceCode: normalizedCode,
            problemId: problemId,
            language: roomMode === 'debug' ? DEBUG_LANGUAGE : language,
          })
        })

        if (!response.ok) {
          throw new Error('Response is not ok')
        }

        const data = await response.json();
        setTestResults([...data.result])

        // Mark Points here
		if (data.ac) {
			markTeamSolved(teamId!, problemId!, roomId!, currentUserName)
		}

        setIsLoading(false);

      } catch (error) {
        console.error(error)
      }
    }


const [activeTab, setActiveTab] = useState<'problem' | 'chat'>('problem');

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex justify-between items-center px-4 py-2 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-bold text-cyan-300">{data?.title}</h2>
          
          {/* Opponents Display */}
          {opponents.length > 0 && (
            <div className="flex items-center gap-2 border-l border-gray-700/80 pl-6">
              <span className="text-xs text-gray-500 uppercase font-bold">VS</span>
              {opponents.map((opp: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5 bg-gray-800/60 px-2 py-1 rounded border border-gray-700">
                  <span className="text-sm text-purple-300">{opp.pid}</span>
                  <span className="text-xs font-mono text-cyan-400 bg-black/40 px-1.5 rounded">
                    {opp.rating || 'Unrated'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* The rest of your header stays exactly the same */}
        <div className="text-xl font-mono bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-cyan-400/20">
          <span className="text-cyan-300">Time Left: {timeLeft}</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            className="font-bold text-gray-900 bg-green-400 border-2 border-green-400 rounded-lg px-4 py-1.5 transition-all duration-300 hover:bg-transparent hover:text-green-300
            disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isMatchOver}
          >
            Submit
          </button>
          <button 
            onClick={() => navigate(`/room/${roomId}/problemset/team/${teamId}`)} 
            className="text-purple-300 hover:text-white transition-colors duration-300 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to problemset
          </button>
        </div>
      </header>

   {/* Main Content */}
   <div className="flex flex-1 min-h-0">
    {/* Left Panel */}
    <div className="w-[45%] flex flex-col border-r border-gray-700/50">
     {/* Tabs */}
     <div className="shrink-0 flex border-b border-gray-700/50">
      <button
       onClick={() => setActiveTab('problem')}
       className={`px-6 py-2 text-sm font-medium transition-all duration-200 ${
        activeTab === 'problem'
         ? 'text-cyan-400 border-b-2 border-cyan-400'
         : 'text-gray-400 hover:text-cyan-300'
       }`}
      >
       Problem Statement
      </button>
      <button
       onClick={() => setActiveTab('chat')}
       className={`px-6 py-2 text-sm font-medium transition-all duration-200 ${
        activeTab === 'chat'
         ? 'text-cyan-400 border-b-2 border-cyan-400'
         : 'text-gray-400 hover:text-cyan-300'
       }`}
      >
       Team Chat
      </button>
     </div>

     {/* Tab Content */}
     <div className="flex-1 min-h-0">
      {activeTab === 'problem' ? (
       <div className="h-full overflow-y-auto px-6 py-4">
        <h3 className="text-xl font-bold text-white mb-4">Problem Statement</h3>
        <p className="text-gray-300 mb-6">
         { data?.statement }
        </p>
        <h3 className="text-xl font-bold text-white mb-4">Input Format</h3>
        <p className="text-gray-300 mb-6">
         { data?.inputFormat || "Use the input shown in examples." }
        </p>
        <h3 className="text-xl font-bold text-white mb-4">Output Format</h3>
        <p className="text-gray-300 mb-6">
         { data?.outputFormat || "Print the corrected output for given input." }
        </p>
         {data?.samples.map((tc, i) => (
           <div key={i}>
           <h3 className="text-xl font-bold text-white mb-4">Example {i + 1}</h3>
             <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
               <code className="text-gray-300">
               <span className="text-purple-400">Input:</span> <pre>{ tc.input }</pre> <br/>
               <span className="text-purple-400">Output:</span> <pre>{ tc.output }</pre>
               </code>
             </div>
           </div>
         ))}

        <h3 className="text-xl font-bold text-white mb-4">Constraints</h3>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
         {data?.constraints || "Follow constraints implied by statement and samples."}
        </ul>
       </div>
      ) : (
       <div className="h-full">
        <ChatBox onClose={() => setActiveTab('problem')} />
       </div>
      )}
     </div>
    </div>

    {/* Right Panel - Editor and Results */}
    <div className="flex-1 flex flex-col">
     {/* Language Select and Editor */}
     <div className="flex-1 min-h-0">
      {roomMode !== 'debug' && (
       <select 
        className="bg-gray-800 text-gray-300 p-1.5 rounded border border-gray-700 m-2" 
        value={language} 
        onChange={handleLangChange}
       >
        <option value="python">Python</option>
        <option value="cpp">C++</option>
        <option value="java">Java</option>
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="go">Golang</option>
        <option value="rust">Rust</option>
       </select>
      )}
      <div className={roomMode === 'debug' ? 'h-full' : 'h-[calc(100%-48px)]'}>
       <Editor 
        theme="vs-dark" 
        language={language} 
        value={code} 
        options={{
         minimap: { enabled: false },
         fontSize: 16,
         wordWrap: 'on',
        }}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
       />
      </div>
     </div>

     {/* Test Results */}
     <div ref={testResultsRef} className="h-[240px] flex border-t border-gray-700/50">
      <div className="w-1/3 p-3 bg-gray-900/70 border-r border-gray-700/50 rounded-l-lg overflow-y-auto space-y-3">
       {testResults.map((res, idx) => (
        <button
         key={idx}
         onClick={() => setSelectedIdx(idx)}
         className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium transition-all
          ${selectedIdx === idx ? "bg-cyan-800/60 text-cyan-300 border border-cyan-400" : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/70"}`}
        >
         <span>Testcase {idx + 1}</span>
         <span
          className={`px-2 py-0.5 rounded text-xs ${
           res.verdict === "Accepted"
            ? "bg-green-500/20 text-green-400"
            : res.verdict
            ? "bg-red-500/20 text-red-400"
            : "bg-gray-500/20 text-gray-400"
          }`}
         >
          {res.verdict || "Pending"}
         </span>
        </button>
       ))}
      </div>

      <div className="w-2/3 bg-gray-950/80 h-full p-6 rounded-r-lg">
       {selectedIdx === null ? (
        <p className="text-gray-400">Select a testcase to view details.</p>
       ) : (
        <div className="space-y-3">
         <h3 className="text-lg font-bold text-cyan-300">
          Testcase {selectedIdx + 1} - {testResults[selectedIdx].verdict}
         </h3>
         {!testResults[selectedIdx].hidden ? (
          <>
           <p className='text-white' >
            <span className="text-purple-400 font-semibold">Input:</span>{" "}
            {testResults[selectedIdx].input}
           </p>
           <p className='text-white' >
            <span className="text-purple-400 font-semibold">Expected:</span>{" "}
            {testResults[selectedIdx].expected}
           </p>
           <p className='text-white' >
            <span className="text-purple-400 font-semibold">Output:</span>{" "}
            {testResults[selectedIdx].output}
           </p>
          </>
         ) : (
          <p className="text-gray-400 italic">
           Hidden testcase — only verdict is shown.
          </p>
         )}
         {testResults[selectedIdx].error && (
          <p className="text-red-400">
           Error: {testResults[selectedIdx].errorMessage}
          </p>
         )}
        </div>
       )}
      </div>

     </div>
    </div>
   </div>

   {/* Loading Overlay */}
   {isLoading && (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50">
     <OrbitProgress 
      color="#32cd32" 
      size="large" 
      text="Testing"
     />
    </div>
   )}
  </div>
 );
};

export default Problem;