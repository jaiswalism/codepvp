import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDoc, doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useUser } from '../hooks/useUser';
import type { ProblemData } from './Problem';
import { updateUserRating } from '../utils/updateUserStats';

// Schema for firebase data
export interface gameRes {
    tournamentId?: string; // Added for tournament logic
    matchId?: string;      // Added for tournament logic
    winningTeam: string;
    teamA: {
        name: string;
        score: number;
        players: {
            pid: string;
            problemsSolved: number;
            points: number;
        }[]
        solvedProblems: string[];
    };
    teamB: {
        name: string;
        score: number;
        players: {
            pid: string;
            problemsSolved: number;
            points: number;
        }[]
        solvedProblems: string[];
    };
    allProblems: ProblemData[];
}

// --- Sub-components ---

const ResultBanner: React.FC<{ didWin: boolean; ratingChange: number | null }> = ({ didWin, ratingChange }) => {
  return (
    <div className="text-center mb-6">
      {didWin ? (
        <h1 className="text-6xl font-bold text-green-400 mb-2" style={{ textShadow: '0 0 15px #2f0, 0 0 20px #2f0' }}>
          VICTORY
        </h1>
      ) : (
        <h1 className="text-6xl font-bold text-red-500 mb-2" style={{ textShadow: '0 0 15px #f22, 0 0 20px #f22' }}>
          DEFEAT
        </h1>
      )}
      
      {ratingChange !== null && (
        <div className={`text-2xl font-mono font-bold mt-2 animate-bounce ${ratingChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {ratingChange >= 0 ? `+${ratingChange}` : ratingChange} Rating
        </div>
      )}
      <p className="text-lg text-gray-300">The match has concluded.</p>
    </div>
  );
};

interface TeamCardProps {
  teamData: gameRes["teamA"] | gameRes["teamB"];
  allProblems: string[];
}

const TeamCard: React.FC<TeamCardProps> = ({ teamData, allProblems }) => {
  const teamColor = teamData.name === 'Team A' ? 'cyan' : 'purple';

  return (
    <div className="bg-gray-900/40 border border-gray-700/50 rounded-lg p-4">
      <h3 className={`text-2xl font-bold text-${teamColor}-400 mb-3 text-center`}>{teamData.name}</h3>
      <div className="mb-4 text-center">
        <p className="text-4xl font-bold text-white">{teamData.score}</p>
        <p className="text-gray-400">Total Points</p>
      </div>
      
      <div className="mb-4">
        {teamData.players.map(player => (
          <div key={player.pid} className="flex justify-between items-center bg-gray-800/50 p-2 rounded mb-2">
            <span className="text-sm truncate text-gray-300 w-2/5">{player.pid}</span>
            <div className="text-right">
              <p className="font-bold text-white">{player.points} pts</p>
            </div>
          </div>
        ))}
      </div>
      
      <div>
        <h4 className="text-lg font-semibold text-gray-300 mb-2 text-center border-t border-gray-700 pt-3">Problems Solved</h4>
        <ul className="space-y-1">
          {allProblems.map(problem => {
            const solved = teamData.solvedProblems.includes(problem);
            return (
              <li key={problem} className={`flex items-center gap-2 ${solved ? 'text-green-400' : 'text-gray-600'}`}>
                {solved ? 
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> :
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                }
                <span>{problem}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

// --- Main GameFinish Component ---

const GameFinishPage: React.FC = () => {
  const [gameData, setGameData] = useState<gameRes | null>(null);
  const [myTeam, setMyTeam] = useState<string | null>(null);
  const [ratingChange, setRatingChange] = useState<number | null>(null);

  const { roomId } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  
  // Guard to prevent double execution of tournament updates
  const hasProcessedTournament = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!roomId || !user) return;

      const docRef = doc(db, "RoomSet", roomId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      
      const data = docSnap.data() as gameRes;
      const currentUserName = user.displayName || user.email || "Anon";

      const winningTeam =
      data.teamA.score > data.teamB.score
        ? "Team A"
        : data.teamB.score > data.teamA.score
        ? "Team B"
        : "Draw";

      setGameData({ ...data, winningTeam });

      const inTeamA = data?.teamA.players.some(p => p.pid === currentUserName);
      const inTeamB = data?.teamB.players.some(p => p.pid === currentUserName);

      if (inTeamA) setMyTeam("Team A");
      else if (inTeamB) setMyTeam("Team B");

      const teamPlayers = inTeamA ? data?.teamA.players : data?.teamB.players;
      const userPlayer = teamPlayers?.find((player) => player.pid === currentUserName);
      
      const userPoints = userPlayer?.points ?? 0;
      const winningBonus = inTeamA ?
        ((data.teamA.score > data.teamB.score) ? 50 : -50) :
        ((data.teamB.score > data.teamA.score) ? 50 : -50);
      
      setRatingChange(userPoints + winningBonus);
      updateUserRating(user.uid, userPoints + winningBonus);

      // ==========================================
      // TOURNAMENT ELIMINATION & SCORING LOGIC
      // ==========================================
      if (data.tournamentId && data.matchId && !hasProcessedTournament.current) {
        hasProcessedTournament.current = true; // Lock execution

        try {
          const matchRef = doc(db, `Tournaments/${data.tournamentId}/Matches`, data.matchId);
          const matchSnap = await getDoc(matchRef);

          // Only proceed if match isn't already marked completed by the other player
          if (matchSnap.exists() && matchSnap.data().status !== 'completed') {
            const matchData = matchSnap.data();
            
            let winnerUid: string | null = null;
            let loserUid: string | null = null;

            if (winningTeam === "Team A") {
              winnerUid = matchData.p1.uid;
              loserUid = matchData.p2?.uid || null;
            } else if (winningTeam === "Team B") {
              winnerUid = matchData.p2?.uid || null;
              loserUid = matchData.p1.uid;
            }

            // 1. Mark Match as Completed (Fixes the infinite loop bug)
            await updateDoc(matchRef, {
              status: 'completed',
              winner: winnerUid,
              loser: loserUid
            });

            // 2. Update Tournament Document (Knockout and Scores)
            const tourneyRef = doc(db, "Tournaments", data.tournamentId);
            const updates: any = {};

            if (loserUid) {
              updates.eliminated = arrayUnion(loserUid);
            }
            if (winnerUid) {
              // Add the user's game points to their total tournament score
              const pointsEarned = winningTeam === "Team A" ? data.teamA.score : data.teamB.score;
              updates[`scores.${winnerUid}`] = increment(pointsEarned);
            }

            if (Object.keys(updates).length > 0) {
              await updateDoc(tourneyRef, updates);
            }
          }
        } catch (err) {
          console.error("Error updating tournament status:", err);
        }
      }
    }

    fetchData();
  }, [roomId, user]);

  return (
    <div className='flex h-dvh justify-center items-center bg-gray-900' >
    <div className="z-10 flex flex-col p-8 max-w-5xl w-full
      bg-black/30 backdrop-blur-md 
      border border-cyan-400/20 rounded-xl
      shadow-2xl shadow-cyan-500/10">
      
      {/* Header */}
      <div className="text-center mb-6">
        <ResultBanner didWin={gameData?.winningTeam === myTeam} ratingChange={ratingChange} />
      </div>

      {/* Main Results Grid */}
      {gameData && (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <TeamCard teamData={gameData?.teamA} allProblems={gameData?.allProblems.map(problem => problem.title)} />
          <TeamCard teamData={gameData?.teamB} allProblems={gameData?.allProblems.map(problem => problem.title)} />
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex gap-4 max-w-md mx-auto w-full">
        {gameData?.tournamentId ? (
          <button 
            onClick={() => navigate(`/tournaments/${gameData.tournamentId}`)}
            className="w-full font-bold text-gray-900 bg-amber-400 border-2 border-amber-400 rounded-lg py-3 text-xl transition-all duration-300 transform hover:scale-105 hover:bg-transparent hover:text-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.7)]"
          >
            Return to Tournament
          </button>
        ) : (
          <button 
            onClick={() => navigate('/')}
            className="w-full font-bold text-gray-900 bg-cyan-300 border-2 border-cyan-300 rounded-lg py-3 text-xl transition-all duration-300 transform hover:scale-105 hover:bg-transparent hover:text-cyan-300 hover:shadow-[0_0_20px_rgba(56,189,248,0.7)]"
          >
            Return to Main Menu
          </button>
        )}
      </div>
      
    </div>
    </div>
  );
};

export default GameFinishPage;