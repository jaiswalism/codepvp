import { db } from "../../firebaseConfig";
import { getDocs, collection, query, where, limit } from "firebase/firestore";
import type { ProblemData } from "./Problem";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

type ProblemWithMeta = ProblemData & { id: string; solved: boolean };

const StatusIcon: React.FC<{ solved: boolean }> = ({ solved }) => {
  if (solved) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>Solved</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
      <span>Pending</span>
    </div>
  );
};

export default function Problemset() {
    const [data, setData] = useState<ProblemWithMeta[] | null>(null);

    const { teamId, roomId } = useParams();

    const navigate = useNavigate();

    useEffect(() => {
    const fetchData = async () => {
      const q = query(
        collection(db, "ProblemsWithHTC"),
        where("difficulty", "==", "Easy"),
        limit(4)
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        solved: false,
        ...doc.data()
      })) as ProblemWithMeta[];
      setData(docs);
    };

    fetchData();
  }, []);

  return (
    <div className="flex justify-center items-center bg-gray-900 h-dvh w-dvw">
    <div className="z-10 flex flex-col p-8 max-w-4xl w-full
      bg-black/30 backdrop-blur-md 
      border border-cyan-400/20 rounded-xl
      shadow-2xl shadow-cyan-500/10">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold text-cyan-300" style={{ textShadow: `0 0 8px #0ff` }}>Problem Set</h2>
        <div className="text-right">
          <p className="text-purple-300 text-lg">Time Remaining</p>
          <p className="text-white text-3xl font-bold">29:45</p>
        </div>
      </div>

      {/* Problem List */}
      <div className="w-full flex flex-col gap-4">
        {data?.map((problem, index) => (
          <div 
            key={index} 
            className="flex justify-between items-center p-4 bg-gray-900/40 border border-gray-700/50 rounded-lg
            hover:bg-gray-800/60 hover:border-cyan-400/50 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl text-gray-600 font-bold">0{index + 1}</span>
              <h3 className="text-2xl text-white">{problem.title}</h3>
            </div>
            <div className="flex items-center gap-6">
              <StatusIcon solved={problem.solved} />
              <button 
                onClick={() => {navigate(`/room/${roomId}/problems/${problem.id}/team/${teamId}`)}}
                className="font-bold text-cyan-300 border-2 border-cyan-400/50 rounded-lg px-5 py-2 
                transition-all duration-300 hover:bg-cyan-300 hover:text-gray-900"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>
      
    </div>
    </div>
  );

}