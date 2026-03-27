import React, { useEffect, useState } from 'react';

export interface Player {
  pid: string;
  rating?: number;
}

interface MatchingProps {
  teamA: Player[];
  teamB: Player[];
  onComplete: () => void;
}

type AnimationPhase = 'initial' | 'entering' | 'holding' | 'exiting';

const Matching: React.FC<MatchingProps> = ({ teamA, teamB, onComplete }) => {
  const [phase, setPhase] = useState<AnimationPhase>('initial');

  useEffect(() => {
    // Phase 1: Start entering immediately after mount
    const enterTimer = setTimeout(() => setPhase('entering'), 100);
    
    // Phase 2: Teams have met in the middle, reveal the "VS"
    const holdTimer = setTimeout(() => setPhase('holding'), 800);
    
    // Phase 3: Hold the screen so they can read the names, then exit
    const exitTimer = setTimeout(() => setPhase('exiting'), 3500);
    
    // Phase 4: Animation finished, trigger parent callback to unmount
    const completeTimer = setTimeout(() => onComplete(), 4300);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  // Helper styles based on the current phase
  const teamAStyle = phase === 'initial' || phase === 'exiting' ? '-translate-x-full' : 'translate-x-0';
  const teamBStyle = phase === 'initial' || phase === 'exiting' ? 'translate-x-full' : 'translate-x-0';
  
  const vsStyle = 
    phase === 'initial' || phase === 'entering' ? 'opacity-0 scale-50' : 
    phase === 'holding' ? 'opacity-100 scale-100' : 
    'opacity-0 scale-150'; // Zooms in and fades out during exit

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex font-sans">
      
      {/* Team A (Left Side) */}
      <div 
        className={`w-1/2 h-full bg-gradient-to-br from-gray-900 to-black border-r border-cyan-500/20 flex flex-col items-center justify-center transform transition-transform duration-700 ease-in-out ${teamAStyle}`}
      >
        <h2 className="text-3xl font-bold text-cyan-400 mb-8 tracking-widest uppercase" style={{ textShadow: '0 0 15px rgba(34,211,238,0.5)' }}>
          Team A
        </h2>
        <div className="flex flex-col gap-4 w-3/4 max-w-sm">
          {teamA.map((player, idx) => (
            <div key={idx} className="flex justify-between items-center bg-gray-800/80 p-4 rounded-xl border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <span className="text-xl text-white font-semibold">{player.pid}</span>
              <span className="text-sm font-mono text-cyan-300 bg-cyan-900/40 px-3 py-1 rounded-md">
                {player.rating || 'Unrated'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Team B (Right Side) */}
      <div 
        className={`w-1/2 h-full bg-gradient-to-bl from-gray-900 to-black border-l border-purple-500/20 flex flex-col items-center justify-center transform transition-transform duration-700 ease-in-out ${teamBStyle}`}
      >
        <h2 className="text-3xl font-bold text-purple-400 mb-8 tracking-widest uppercase" style={{ textShadow: '0 0 15px rgba(168,85,247,0.5)' }}>
          Team B
        </h2>
        <div className="flex flex-col gap-4 w-3/4 max-w-sm">
          {teamB.map((player, idx) => (
            <div key={idx} className="flex justify-between items-center bg-gray-800/80 p-4 rounded-xl border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
              <span className="text-xl text-white font-semibold">{player.pid}</span>
              <span className="text-sm font-mono text-purple-300 bg-purple-900/40 px-3 py-1 rounded-md">
                {player.rating || 'Unrated'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Center "VS" Badge */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className={`flex items-center justify-center w-32 h-32 rounded-full bg-black border-4 border-gray-800 shadow-[0_0_50px_rgba(0,0,0,1)] transition-all duration-500 ease-out z-10 ${vsStyle}`}
        >
          <span 
            className="text-6xl font-black italic bg-clip-text text-transparent bg-gradient-to-br from-cyan-400 to-purple-500"
            style={{ filter: 'drop-shadow(0px 0px 10px rgba(255,255,255,0.3))' }}
          >
            VS
          </span>
        </div>
      </div>

    </div>
  );
};

export default Matching;