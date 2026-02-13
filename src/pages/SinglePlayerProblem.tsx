import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useUser } from '../hooks/useUser';
import { OrbitProgress } from 'react-loading-indicators';
import { incrementQuestionsSolved } from '../utils/updateUserStats';

// Problem Data schema
export interface ProblemData {
  constraints: string;
  difficulty: string;
  hiddenTestCases: {
    input: string;
    output: string;
  }[];
  inputFormat: string;
  outputFormat: string;
  samples: {
    input: string;
    output: string;
  }[];
  statement: string;
  tags: string[];
  title: string;
}

// Test case interface
interface TestCases {
  input: string;
  expected: string;
  output: string;
  hidden: boolean;
  verdict: string;
  error: boolean;
  errorMessage: string;
}

// Language mapping for Judge0
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

const SinglePlayerProblem: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const [data, setData] = useState<ProblemData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState("");
  const [testResults, setTestResults] = useState<TestCases[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const testResultsRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Fetch problem data
  useEffect(() => {
    if (!problemId) return;

    const fetchProblem = async () => {
      try {
        const docRef = doc(db, "ProblemsWithHTC", problemId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data() as ProblemData);
        } else {
          console.error("Problem not found");
          navigate('/SinglePlayer');
        }
      } catch (error) {
        console.error("Error fetching problem:", error);
      }
    };

    fetchProblem();
  }, [problemId, navigate]);

  const handleLangChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as Language);
  };

  function handleEditorDidMount(editorInstance: editor.IStandaloneCodeEditor) {
    editorRef.current = editorInstance;
  }

  function handleEditorChange(newValue: string | undefined) {
    setCode(newValue || "");
  }

  // Submit code via backend API
  const handleSubmit = async () => {
    setIsLoading(true);
    const sourceCode = editorRef.current?.getValue();
    
    if (!sourceCode || sourceCode === "") {
      setIsLoading(false);
      return;
    }

    const normalizedCode = sourceCode.replace(/\r\n/g, "\n");

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/submit`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceCode: normalizedCode,
          problemId: problemId,
          language: language,
        })
      });

      if (!response.ok) {
        throw new Error('Response is not ok');
      }

      const responseData = await response.json();
      setTestResults([...responseData.result]);

      // If all test cases passed, increment questions solved count
      if (responseData.ac && user?.uid) {
        try {
          await incrementQuestionsSolved(user.uid, 1);
          console.log('✅ Problem solved! Questions count incremented.');
        } catch (error) {
          console.error("Error incrementing questions solved:", error);
        }
      }

      setTimeout(() => {
        testResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      setIsLoading(false);
    } catch (err: any) {
      console.error("Error submitting code:", err);
      setIsLoading(false);
    }
  };

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-300 border-green-400';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400';
      case 'Hard': return 'bg-red-500/20 text-red-300 border-red-400';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400';
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex justify-between items-center px-4 py-2 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-cyan-300">{data?.title || "Loading..."}</h2>
          {data && (
            <span className={`text-xs font-semibold px-3 py-1 border rounded-full ${getDifficultyClass(data.difficulty)}`}>
              {data.difficulty}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            className="font-bold text-gray-900 bg-green-400 border-2 border-green-400 rounded-lg px-6 py-2 transition-all duration-300 hover:bg-transparent hover:text-green-300"
            disabled={isLoading}
          >
            {isLoading ? "Running..." : "Run & Submit"}
          </button>
          <button
            onClick={() => navigate('/SinglePlayer')}
            className="text-purple-300 hover:text-white transition-colors duration-300 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Problems
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Problem Description */}
        <div className="w-[45%] flex flex-col border-r border-gray-700/50">
          <div className="flex-1 overflow-y-auto p-6 bg-gray-900/30">
            {data ? (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Problem Statement</h3>
                <p className="text-gray-300 mb-6 whitespace-pre-wrap">{data.statement}</p>

                <h3 className="text-xl font-bold text-white mb-4">Input Format</h3>
                <p className="text-gray-300 mb-6">{data.inputFormat}</p>

                <h3 className="text-xl font-bold text-white mb-4">Output Format</h3>
                <p className="text-gray-300 mb-6">{data.outputFormat}</p>

                {data.samples.map((tc, i) => (
                  <div key={i}>
                    <h3 className="text-xl font-bold text-white mb-4">Example {i + 1}</h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
                      <code className="text-gray-300">
                        <span className="text-purple-400">Input:</span>
                        <pre>{tc.input}</pre>
                        <br />
                        <span className="text-purple-400">Output:</span>
                        <pre>{tc.output}</pre>
                      </code>
                    </div>
                  </div>
                ))}

                <h3 className="text-xl font-bold text-white mb-4">Constraints</h3>
                <div className="text-gray-300 whitespace-pre-wrap">{data.constraints}</div>

                {data.tags && data.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-white mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Editor and Results */}
        <div className="flex-1 flex flex-col">
          {/* Language Select and Editor */}
          <div className="flex-1 min-h-0">
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
            <div className="h-[calc(100%-48px)]">
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
            <div className="flex h-full gap-3 flex-col w-1/3 p-3 bg-gray-900/70 border-r border-gray-700/50 rounded-l-lg overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-400 text-sm p-4">Run your code to see test results</p>
              ) : (
                testResults.map((res, idx) => (
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
                ))
              )}
            </div>

            <div className="w-2/3 bg-gray-950/80 h-full p-6 rounded-r-lg overflow-y-auto">
              {selectedIdx === null ? (
                <p className="text-gray-400">Select a testcase to view details.</p>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-cyan-300">
                    Testcase {selectedIdx + 1} - {testResults[selectedIdx].verdict}
                  </h3>
                  {!testResults[selectedIdx].hidden ? (
                    <>
                      <p className="text-white">
                        <span className="text-purple-400 font-semibold">Input:</span>{" "}
                        <pre className="mt-1 bg-gray-900/50 p-2 rounded">{testResults[selectedIdx].input}</pre>
                      </p>
                      <p className="text-white">
                        <span className="text-purple-400 font-semibold">Expected:</span>{" "}
                        <pre className="mt-1 bg-gray-900/50 p-2 rounded">{testResults[selectedIdx].expected}</pre>
                      </p>
                      <p className="text-white">
                        <span className="text-purple-400 font-semibold">Output:</span>{" "}
                        <pre className="mt-1 bg-gray-900/50 p-2 rounded">{testResults[selectedIdx].output}</pre>
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-400 italic">
                      Hidden testcase — only verdict is shown.
                    </p>
                  )}
                  {testResults[selectedIdx].error && (
                    <p className="text-red-400">
                      <span className="font-semibold">Error:</span>
                      <pre className="mt-1 bg-red-900/20 p-2 rounded">{testResults[selectedIdx].errorMessage}</pre>
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
          <OrbitProgress color="#32cd32" size="large" text="Testing" />
        </div>
      )}
    </div>
  );
};

export default SinglePlayerProblem;
