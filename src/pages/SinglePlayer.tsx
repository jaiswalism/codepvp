import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { DashboardNav } from './components/dashboard/dashboard-nav';

interface Problem {
    id: string;
    title: string;
    statement: string;
    difficulty: string;
    tags: string[];
}

const SinglePlayer: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(!user) navigate("/login");
    }, [user, navigate]);

    // Fetch problems from Firestore
    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const problemsRef = collection(db, "ProblemsWithHTC");
                const querySnapshot = await getDocs(problemsRef);
                const fetchedProblems: Problem[] = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    title: doc.data().title,
                    statement: doc.data().statement,
                    difficulty: doc.data().difficulty,
                    tags: doc.data().tags || [],
                }));
                setProblems(fetchedProblems);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching problems:", error);
                setLoading(false);
            }
        };

        fetchProblems();
    }, []);

    const handleClick = () => {
        navigate('/');
    };

    // Helper function to determine the color and style of the difficulty tag
    const getLevelClass = (level: string) => {
        switch (level) {
            case 'Easy': return 'bg-green-500/20 text-green-300 border-green-400';
            case 'Medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400';
            case 'Hard': return 'bg-red-500/20 text-red-300 border-red-400';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-400';
        }
    };

    // Truncate description to fit in card
    const truncateText = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <DashboardNav />
            
            {/* Main Content */}
            <div className="relative z-10 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header section with title and back button */}
                    <div className="w-full flex justify-between items-center mb-8">
                        <h2 className="text-5xl font-bold text-cyan-300" style={{ textShadow: `0 0 8px #0ff` }}>Practice Problems</h2>
                        <button onClick={handleClick} className="text-purple-300 hover:text-white transition-colors duration-300 text-lg flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            Back to Menu
                        </button>
                    </div>

            {loading ? (
                <div className="flex items-center justify-center w-full h-64">
                    <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"/>
                </div>
            ) : (
                /* Grid layout for the problem cards */
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {problems.map((problem) => (
                        <div key={problem.id} className="flex flex-col justify-between p-5 rounded-lg bg-gray-900/50 border border-gray-700/50 hover:border-cyan-400/70 hover:-translate-y-1 transition-all duration-300 shadow-lg">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xl text-white font-bold line-clamp-2">{problem.title}</h3>
                                    <span className={`text-xs font-semibold px-3 py-1 border rounded-full whitespace-nowrap ml-2 ${getLevelClass(problem.difficulty)}`}>
                                        {problem.difficulty}
                                    </span>
                                </div>
                                <p className="text-gray-400 mb-3 text-sm line-clamp-3">{truncateText(problem.statement, 150)}</p>
                                
                                {/* Tags */}
                                {problem.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {problem.tags.slice(0, 3).map((tag, idx) => (
                                            <span key={idx} className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                        {problem.tags.length > 3 && (
                                            <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded">
                                                +{problem.tags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="mt-auto">
                                <button 
                                    onClick={() => navigate(`/practice/${problem.id}`)}
                                    className="w-full font-bold text-cyan-300 border-2 border-cyan-400/50 rounded-lg py-2 transition-all duration-300 hover:bg-cyan-300 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(56,189,248,0.7)]">
                                    Solve Problem
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && problems.length === 0 && (
                <div className="text-center text-gray-400 mt-12">
                    <p className="text-xl">No problems found</p>
                </div>
            )}
                </div>
            </div>
        </div>
    );
};

export default SinglePlayer;
