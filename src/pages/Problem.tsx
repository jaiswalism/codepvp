import React, { useEffect, useRef, useState, useMemo } from 'react';
import Editor from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { socket } from '../utils/socket';
import useAuth from '../hooks/useAuth';
import { debounce } from 'lodash';

// interface ProblemData {
//     category: string;
//     difficulty: string;
//     slug: string;
//     title: string;
//     stmt: string;
//     testcases: {
//             stdin: string;
//             expected_output: string;
//             hidden: boolean;
//             display: {
//                 input: string;
//                 output: string
//             }
//     }[];
//     constraints: string[];
//     starter_code: {
//       c: string;
//       cpp: string;
//       csharp: string;
//       dart: string;
//       elixir: string;
//       erlang: string;
//       golang: string;
//       java: string;
//       javascript: string;
//       kotlin: string;
//       php: string;
//       python: string;
//       python3: string;
//       racket: string;
//       ruby: string;
//       rust: string;
//       scala: string;
//       swift: string;
//       typescript: string;
//     }
//     tags: string[];
// }

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

const Problem: React.FC = () => {

    const { problemId } = useParams<{ problemId: string }>();
    const { roomId } = useParams<{ roomId: string }>();

    const [data, setData] = useState<ProblemData | null>(null);

    const { user } = useAuth();
    const currentUserName = user?.displayName || user?.email || "Anon";

    const[code, setCode] = useState("");

    const sendChange = useMemo(() =>
    debounce((newValue: string) => {
      socket?.emit("editorChange", { roomId, problemId, code: newValue, source: currentUserName });
    }, 1000),
  [socket, roomId, problemId, currentUserName]);


//     const twoSumHarness = `
// def run_tests() :
//     output = twoSum([3, 2, 4], 6)
//     expected = [1, 2]
//     if sorted(output) == sorted(expected):
//         print("Passed")
//     else:
//         print("Failed")
// run_tests()
//     `

    // Fetch problem data
    useEffect(() => {
        if (!problemId) return;
        getDocumentData("ProblemsWithHTC", problemId);
    }, [problemId]);

    // Socket Connection
    useEffect(() => {

        if(!roomId || !problemId) return;

        socket.emit("joinProblemRoom", { roomId, problemId, username: currentUserName });

        return () => {
            socket.disconnect();
        };

    }, [roomId, problemId, currentUserName]);

    // Listening changes on editor
    useEffect(() => {
        if (!socket) return;

        const handleRemoteChange = (data: { code: string; source: string }) => {

            if(data.source == currentUserName) return;

            const editor = editorRef.current;
            const model = editor?.getModel();
            if (model && model.getValue() !== data.code) {
              const fullRange = model.getFullModelRange();
              model.pushEditOperations([], [{ range: fullRange, text: data.code }], () => null);
            }
        };

        socket.on("editorUpdate", handleRemoteChange);

        return () => {
            socket.off("editorUpdate", handleRemoteChange);
        };
    }, [socket]);

    async function getDocumentData(collectionName: string, documentId: string) {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()) {
            setData(docSnap.data() as ProblemData);
            // setCode(docSnap.data().starter_code.python);
            console.log(docSnap.data());
        } else {
            console.log("GAY")
        }
    }

    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    function handleEditorDidMount(editorInstance: editor.IStandaloneCodeEditor) {
        editorRef.current = editorInstance;
    }

    const checkStatus = async (tokens: string[]) => {
      const tokenQuery = tokens.join(",")
        const baseUrl = `https://judge0-ce.p.rapidapi.com/submissions/batch?tokens=${tokenQuery}&base64_encoded=true&fields=*`;
        const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': import.meta.env.VITE_RAPID_API_KEY as string,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        },
        };

        try {

          let allDone = false;
          let results: any[] = [];

          while (!allDone) {
            const url = `${baseUrl}&_=${Date.now()}`
            let response = await fetch(url, options);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            let data = await response.json();
            results = data.submissions || data; // judge0 sometimes wraps inside `submissions`

            // Guard: remove nulls
            results = results.filter((res: any) => res !== null);

            // If we still have missing results, keep polling
            allDone =
              results.length === tokens.length &&
              results.every(
                (res: any) => res.status?.id !== 1 && res.status?.id !== 2
              );

            if (!allDone) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }


          results.forEach((res: any, idx: number) => {

            if (!res || !res.status) {
              console.log(`Testcase ${idx + 1}: ❌ Invalid response (null result)`);
              return;
            }

            const stdout = res.stdout ? atob(res.stdout) : null;
            const stderr = res.stderr ? atob(res.stderr) : null;
            const compileError = res.compile_output ? atob(res.compile_output) : null;

            const verdict = res.status?.description || "Unknown";
            const passed = res.status?.id === 3; // 3 = Accepted

            let finalOutput = `\nTestcase ${idx + 1}:\nStatus: ${verdict}\n`;
            if (stdout) finalOutput += `Output:\n${stdout}\n`;
            if (stderr) finalOutput += `Error:\n${stderr}\n`;
            if (compileError) finalOutput += `Compile Error:\n${compileError}\n`;

            if (passed) {
              finalOutput += "✅ Test Passed!\n";
            } else {
              finalOutput += "❌ Test Failed!\n";
            }

            console.log(finalOutput);
          });
          
        } catch (err: any) {
            console.error(err);
        }
    };

    async function Run() {
        const sourceCode = editorRef.current?.getValue();
        const url = 'https://judge0-ce.p.rapidapi.com/submissions/batch?fields=*';
        const normalizedCode = sourceCode?.replace(/\r\n/g, "\n") || "";
        let submissions: {}[] = [];

        // get sample testcases
        data?.samples.map((tc) => {
          submissions.push(
            {
              source_code: normalizedCode,
              language_id: 71,
              stdin: tc.input,
              expected_output: tc.output,
            }
          );
        })

        data?.hiddenTestCases.map((tc) => {
          submissions.push(
            {
              source_code: normalizedCode,
              language_id: 71,
              stdin: tc.input,
              expected_output: tc.output,
            }
          );
        })

        console.log(submissions);

        const options = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': import.meta.env.VITE_RAPID_API_KEY as string,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            },
            body: JSON.stringify({
              submissions: submissions
            }),
        };

        try {
            const response = await fetch(url, options);
            if(!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const tokens = data.map((d: any) => d.token);
            await checkStatus(tokens);
        } catch (err: any) {
            console.error(err);
        }
    }

  return (
    <div className="z-10 flex flex-col h-dvh w-full max-w-dvw
      bg-black backdrop-blur-md 
      border border-cyan-400/20
      shadow-2xl shadow-cyan-500/10">
      
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h2 className="text-2xl font-bold text-cyan-300">{ data?.title }</h2>
        {/* <button className="text-purple-300 hover:text-white transition-colors duration-300 text-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Topics
        </button> */}
      </header>

      {/* Main Content Area */}
      <div className="flex flex-grow overflow-hidden">
        {/* Left Side: Problem Description */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-4">Problem Statement</h3>
          <p className="text-gray-300 mb-6">
            { data?.statement }
          </p>
          <h3 className="text-xl font-bold text-white mb-4">Input Format</h3>
          <p className="text-gray-300 mb-6">
            { data?.inputFormat }
          </p>
          <h3 className="text-xl font-bold text-white mb-4">Output Format</h3>
          <p className="text-gray-300 mb-6">
            { data?.outputFormat }
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
          {/* <h3 className="text-xl font-bold text-white mb-4">Example 1</h3>
          <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
            <code className="text-gray-300">
              <span className="text-purple-400">Input:</span> { data?.testcases.display.input }<br/>
              <span className="text-purple-400">Output:</span> [0, 1]<br/>
              <span className="text-purple-400">Explanation:</span> Because nums[0] + nums[1] == 9, we return [0, 1].
            </code>
          </div> */}

          {/* <h3 className="text-xl font-bold text-white mb-4">Example 2</h3>
          <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
            <code className="text-gray-300">
              <span className="text-purple-400">Input:</span> nums = [3, 2, 4], target = 6<br/>
              <span className="text-purple-400">Output:</span> [1, 2]
            </code>
          </div> */}

          <h3 className="text-xl font-bold text-white mb-4">Constraints</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            {data?.constraints}
          </ul>
        </div>

        {/* Right Side: Code Editor and Actions */}
        <div className="w-1/2 flex flex-col border-l border-gray-700/50">
          {/* This is now just a placeholder for the editor */}
          <div className="flex-grow bg-gray-900/50 p-4">
             <Editor 
                theme="vs-dark" 
                defaultLanguage='python' 
                value={code} 
                options={{
                    minimap: { enabled: false },
                    fontSize: 16,
                    wordWrap: 'on',
                }}
                onMount={handleEditorDidMount}
                onChange={(newValue) => {
                  setCode(newValue || "");

                  sendChange(newValue || "");
                }}
            />
          </div>
          <div className="flex justify-end items-center p-4 bg-gray-900/50 border-t border-gray-700/50 gap-4">
            <button onClick={Run} className="font-bold text-cyan-300 border-2 border-cyan-400/50 rounded-lg px-6 py-2 transition-all duration-300 hover:bg-cyan-300 hover:text-gray-900">
              Run
            </button>
            <button className="font-bold text-gray-900 bg-green-400 border-2 border-green-400 rounded-lg px-6 py-2 transition-all duration-300 hover:bg-transparent hover:text-green-300">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Problem;
