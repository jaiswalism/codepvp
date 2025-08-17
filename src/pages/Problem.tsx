import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';

interface ProblemData {
    title: string;
    stmt: string;
    testcases: {
            stdin: string;
            expected_output: string;
            hidden: boolean;
            display: {
                input: string;
                output: string
            }
    }[];
    constraints: string[];
}

const Problem: React.FC = () => {

    const { problemId } = useParams<{ problemId: string }>();

    const [data, setData] = useState<ProblemData | null>(null)

    useEffect(() => {
        if(problemId) {
            console.log(problemId);
            getDocumentData("problems", problemId);
            console.log(data);
        }
    }, [problemId])

    async function getDocumentData(collectionName: string, documentId: string) {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()) {
            setData(docSnap.data() as ProblemData);
        } else {
            console.log("GAY")
        }
    }

    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    function handleEditorDidMount(editorInstance: editor.IStandaloneCodeEditor) {
        editorRef.current = editorInstance;
    }

    function Run() {
        const sourceCode = editorRef.current?.getValue();
        console.log(sourceCode);
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
            { data?.stmt }
          </p>
            {data?.testcases.filter(tc => !tc.hidden).map((tc, i) => (
                <div key={i}>
                <h3 className="text-xl font-bold text-white mb-4">Example {i + 1}</h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
                        <code className="text-gray-300">
                        <span className="text-purple-400">Input:</span> { tc.display.input }<br/>
                        <span className="text-purple-400">Output:</span> { tc.display.output }<br/>
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
            {data?.constraints.map((c, i) => (
                <li key={i}>{ c }</li>
            ))}
          </ul>
        </div>

        {/* Right Side: Code Editor and Actions */}
        <div className="w-1/2 flex flex-col border-l border-gray-700/50">
          {/* This is now just a placeholder for the editor */}
          <div className="flex-grow bg-gray-900/50 p-4">
             <Editor 
                theme="vs-dark" 
                defaultLanguage='python' 
                defaultValue='# Code Here' 
                options={{
                    minimap: { enabled: false },
                    fontSize: 16,
                    wordWrap: 'on',
                }}
                onMount={handleEditorDidMount}
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
