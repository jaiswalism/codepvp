import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

const SinglePlayer: React.FC = () => {

    const navigate = useNavigate();

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if(!user) {
                navigate('/login');
            }
        })
    })

    const handleClick = () => {
        navigate('/');
    }

    // Data for the different coding challenge topics
    const topics = [
        { title: "Arrays & Hashing", description: "Master the fundamentals of data manipulation and lookup.", level: "Beginner", challenges: 8, completed: 5 },
        { title: "Two Pointers", description: "Efficiently solve problems by traversing data from both ends.", level: "Novice", challenges: 6, completed: 2 },
        { title: "Sliding Window", description: "Optimize solutions for subarray and substring problems.", level: "Novice", challenges: 7, completed: 1 },
        { title: "Stack", description: "Understand the LIFO principle for complex logical problems.", level: "Beginner", challenges: 4, completed: 4 },
        { title: "Binary Search", description: "Quickly find elements in sorted data structures.", level: "Intermediate", challenges: 9, completed: 3 },
        { title: "Linked List", description: "Manage dynamic data structures with nodes and pointers.", level: "Intermediate", challenges: 10, completed: 0 },
        { title: "Trees & Tries", description: "Navigate hierarchical data structures for advanced lookups.", level: "Veteran", challenges: 12, completed: 1 },
        { title: "Dynamic Programming", description: "Break down complex problems into simpler sub-problems.", level: "Veteran", challenges: 15, completed: 0 },
    ];

    // Helper function to determine the color and style of the level tag
    const getLevelClass = (level: string) => {
        switch (level) {
            case 'Beginner': return 'bg-green-500/20 text-green-300 border-green-400';
            case 'Novice': return 'bg-cyan-500/20 text-cyan-300 border-cyan-400';
            case 'Intermediate': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400';
            case 'Veteran': return 'bg-red-500/20 text-red-300 border-red-400';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-400';
        }
    };

    return (
        <div className="z-10 flex flex-col items-center p-8 max-w-dvw h-dvh w-full
          bg-gray-900 backdrop-blur-md 
          border border-cyan-400/20
          shadow-2xl shadow-cyan-500/10">
            {/* <AnimatedBackground /> */}
            
            {/* Header section with title and back button */}
            <div className="w-full flex justify-between items-center mb-8">
                <h2 className="text-5xl font-bold text-cyan-300" style={{ textShadow: `0 0 8px #0ff` }}>Challenge Topics</h2>
                <button onClick={handleClick} className="text-purple-300 hover:text-white transition-colors duration-300 text-lg flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back to Menu
                </button>
            </div>

            {/* Grid layout for the topic cards */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {topics.map((topic, index) => (
                    <div key={index} className="flex flex-col justify-between p-5 rounded-lg bg-gray-900/50 border border-gray-700/50 hover:border-cyan-400/70 hover:-translate-y-1 transition-all duration-300">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-2xl text-white font-bold">{topic.title}</h3>
                                <span className={`text-xs font-semibold px-3 py-1 border rounded-full ${getLevelClass(topic.level)}`}>
                                    {topic.level}
                                </span>
                            </div>
                            <p className="text-gray-400 mb-4 text-sm">{topic.description}</p>
                        </div>
                        <div className="mt-auto">
                            {/* Progress bar */}
                            <div className="w-full bg-gray-700/50 rounded-full h-2.5 mb-2">
                                <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${(topic.completed / topic.challenges) * 100}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-300 mb-4">{topic.completed} / {topic.challenges} Challenges Completed</p>
                            <button className="w-full font-bold text-cyan-300 border-2 border-cyan-400/50 rounded-lg py-2 transition-all duration-300 hover:bg-cyan-300 hover:text-gray-900 hover:shadow-[0_0_15px_rgba(56,189,248,0.7)]">
                                Begin Challenges
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SinglePlayer;
