import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, setDoc, getDocs, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useUser } from '../hooks/useUser';
import LoadingScreen from './components/LoadingScreen';
import { socket } from '../utils/socket';
import { Calendar, Users, ShieldAlert, Gift, ChevronLeft, Crown, UserMinus, Play } from 'lucide-react';

// Interfaces
interface Prize { rank: string; reward: string; }
interface Match { id: string; p1: Player; p2: Player | null; status: 'pending' | 'active' | 'completed'; roomId: string; winner?: string; loser?: string; }
interface Tournament { id: string; name: string; description: string; status: string; visibility: string; startDate: any; endDate: any; rules: string; prizes: Prize[]; participants?: string[]; eliminated?: string[]; scores?: Record<string, number>; }
interface Player { uid: string; username: string; avatar: string; rating: number; skillLevel: string; }

// Default Tournament Match Settings
const TOURNAMENT_SETTINGS = { mode: 'normal', difficulty: 'Easy', size: '1v1', questions: 2, time: 10 };

const TournamentLobby: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user, userData, loading: userLoading } = useUser();
  const isAdmin = userData?.role === 'admin'; 

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]); // Hold generated matches
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'matches'>('overview');

  const currentUserName = userData?.username || user?.email || "Anon";

  // Find out who is still alive
  const survivingPlayers = players.filter(p => !tournament?.eliminated?.includes(p.uid));
  const isTournamentOver = players.length > 1 && survivingPlayers.length === 1;
  const ultimateWinner = isTournamentOver ? survivingPlayers[0] : null;

  useEffect(() => {
    if (!user && !userLoading) navigate("/login");
  }, [user, userLoading, navigate]);

  // --- SOCKET REGISTRATION ---
  // Tells the backend who is listening on this page
  useEffect(() => {
    if (currentUserName) {
      socket.emit("registerUser", { username: currentUserName });
    }
  }, [currentUserName]);

  useEffect(() => {
    const fetchTournamentAndPlayers = async () => {
      if (!tournamentId) return;
      try {
        const tourneyRef = doc(db, "Tournaments", tournamentId);
        const tourneySnap = await getDoc(tourneyRef);
        
        if (!tourneySnap.exists()) return navigate("/404");
        
        const tourneyData = { id: tourneySnap.id, ...tourneySnap.data() } as Tournament;
        setTournament(tourneyData);

        const participantUids = tourneyData.participants || [];
        if (participantUids.length > 0) {
          const playerPromises = participantUids.map(uid => getDoc(doc(db, "users", uid)));
          const playerDocs = await Promise.all(playerPromises);
          
          const fetchedPlayers = playerDocs
            .filter(doc => doc.exists())
            .map(doc => ({ uid: doc.data().uid, username: doc.data().username, avatar: doc.data().avatar, rating: doc.data().rating || 0, skillLevel: doc.data().skillLevel } as Player));

          fetchedPlayers.sort((a, b) => b.rating - a.rating);
          setPlayers(fetchedPlayers);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTournamentAndPlayers();
  }, [tournamentId, navigate]);

  // --- REAL-TIME MATCH LISTENER (Auto-redirect users) ---
  useEffect(() => {
    const handleTeleport = ({ roomId, team }: { roomId: string, team: string }) => {
      navigate(`/room/${roomId}/problemset/team/${team}`);
    };

    socket.on("tournamentMatchStarted", handleTeleport);

    return () => {
      socket.off("tournamentMatchStarted", handleTeleport);
    };
  }, [navigate]);

  useEffect(() => {
    if (!tournamentId) return;
    
    // Listen to the Matches subcollection for this tournament
    const matchesRef = collection(db, `Tournaments/${tournamentId}/Matches`);
    
    const unsubscribe = onSnapshot(matchesRef, (snapshot) => {
      const fetchedMatches: Match[] = [];
      snapshot.forEach(doc => fetchedMatches.push({ id: doc.id, ...doc.data() } as Match));
      setMatches(fetchedMatches);
    });

    return () => unsubscribe();
  }, [tournamentId]);

  // --- USER ACTION: JOIN ---
  const handleJoinTournament = async () => {
    if (!user || !tournament) return;
    setIsJoining(true);
    try {
      await updateDoc(doc(db, "Tournaments", tournament.id), { participants: arrayUnion(user.uid) });
      setTournament(prev => prev ? { ...prev, participants: [...(prev.participants || []), user.uid] } : null);
      alert("Successfully joined! Awaiting Admin instructions.");
    } catch (err) {
      alert("Failed to join.");
    } finally {
      setIsJoining(false);
    }
  };

  // --- ADMIN ACTION: REMOVE PLAYER ---
  const handleRemovePlayer = async (uidToRemove: string, username: string) => {
    if (!isAdmin || !tournament) return;
    if (!window.confirm(`Are you sure you want to kick ${username} from the tournament?`)) return;

    try {
      await updateDoc(doc(db, "Tournaments", tournament.id), {
        participants: arrayRemove(uidToRemove)
      });
      // Update UI
      setTournament(prev => prev ? { ...prev, participants: prev.participants?.filter(uid => uid !== uidToRemove) } : null);
      setPlayers(prev => prev.filter(p => p.uid !== uidToRemove));
    } catch (err) {
      alert("Error removing player.");
    }
  };

  // --- ADMIN ACTION: GENERATE MATCHES & SAVE TO DB ---
  const handleGenerateMatches = async () => {
    if (!tournamentId) return;
    // Filter out eliminated players
    const activePlayers = players.filter(p => !tournament?.eliminated?.includes(p.uid));
    let shuffled = [...activePlayers].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < shuffled.length; i += 2) {
      const matchId = `match_${Date.now()}_${i}`;
      const roomId = Math.floor(100000 + Math.random() * 900000).toString();
      
      const newMatch: Match = {
        id: matchId,
        p1: shuffled[i],
        p2: shuffled[i + 1] || null, // null = Bye
        status: 'pending',
        roomId: roomId
      };

      // Save to subcollection
      await setDoc(doc(db, `Tournaments/${tournamentId}/Matches`, matchId), newMatch);
    }
    setActiveTab('matches');
    alert("Brackets generated and saved!");
  };

  // --- 2. ADMIN ACTION: START MATCH ---
  const handleStartMatch = async (match: Match) => {
    if (!window.confirm(`Force start match for Room ${match.roomId}?`)) return;
    
    try {
      // 1. Fetch Random Questions based on tournament settings
      const q = query(collection(db, "ProblemsWithHTC"), where("difficulty", "==", TOURNAMENT_SETTINGS.difficulty));
      const querySnapshot = await getDocs(q);
      const allProblems = querySnapshot.docs.map(doc => ({ id: doc.id, statusA: 0, statusB: 0, ...doc.data() }));
      const selectedProblems = allProblems.sort(() => Math.random() - 0.5).slice(0, TOURNAMENT_SETTINGS.questions);

      // 2. Setup the Base Room Meta (Needed for your existing architecture)
      await setDoc(doc(db, "rooms", match.roomId), TOURNAMENT_SETTINGS);

      // 3. Setup the RoomSet (Game State)
      await setDoc(doc(db, "RoomSet", match.roomId), {
        tournamentId: tournamentId, 
        matchId: match.id,
        winningTeam: null,
        startedAt: serverTimestamp(),
        allProblems: selectedProblems,
        teamA: {
          name: match.p1.username,
          score: 0,
          solvedProblems: [],
          players: [{ pid: match.p1.username, points: 0, problemsSolved: 0 }]
        },
        teamB: {
          name: match.p2 ? match.p2.username : "BYE",
          score: 0,
          solvedProblems: [],
          players: match.p2 ? [{ pid: match.p2.username, points: 0, problemsSolved: 0 }] : []
        }
      });

      // 4. Update the visual match status in Firestore so everyone sees it's running
      await updateDoc(doc(db, `Tournaments/${tournamentId}/Matches`, match.id), { status: 'active' });
      setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'active' } : m));

      // 5. THE MAGIC FIX: Tell the backend to build the room and teleport the players!
      socket.emit("forceStartTournamentMatch", {
        roomId: match.roomId,
        p1Username: match.p1.username,
        p2Username: match.p2 ? match.p2.username : null,
        time: TOURNAMENT_SETTINGS.time,
        adminName: currentUserName
      });

      alert(`Match Started! Players have been teleported to Room ${match.roomId}.`);
    } catch (err) {
      console.error("Error starting match:", err);
      alert("Failed to start match.");
    }
  };

  // --- ADMIN ACTION: END TOURNAMENT ---
  const handleEndTournament = async () => {
    if (!tournamentId || !ultimateWinner) return;
    if (!window.confirm(`Crown ${ultimateWinner.username} as the Grand Champion and close this tournament?`)) return;

    try {
      await updateDoc(doc(db, "Tournaments", tournamentId), { 
        status: 'Completed',
        championUid: ultimateWinner.uid
      });
      
      setTournament(prev => prev ? { ...prev, status: 'Completed', championUid: ultimateWinner.uid } : null);
      alert("Tournament officially concluded! 🏆");
    } catch (err) {
      console.error("Error closing tournament:", err);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "TBD";
    return timestamp.toDate().toLocaleString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };


  if (isLoading || !tournament) return <LoadingScreen message="Initializing Arena..." />;
  const hasJoined = tournament.participants?.includes(user?.uid || "");

  return (
    <div className='bg-gray-900 min-h-screen text-white font-mono flex flex-col items-center py-10 px-4'>
      <div className="max-w-5xl w-full">
        
        {/* Navigation & Header... (Kept similar to previous code) */}
        <button onClick={() => navigate('/tournaments')} className="text-cyan-400 hover:text-white transition-colors duration-300 text-sm flex items-center gap-2 mb-6">
          <ChevronLeft size={20} /> Back to Tournaments
        </button>

        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg mb-2">{tournament.name}</h1>
              <p className="text-cyan-200/70 max-w-2xl text-sm leading-relaxed">{tournament.description}</p>
            </div>

            {/* ACTION AREA / CHAMPION SHOWCASE */}
            <div className="w-full md:w-auto flex flex-col gap-3 shrink-0">
              
              {/* STATE 1: TOURNAMENT COMPLETED */}
              {tournament.status === "Completed" ? (
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-900/40 border border-amber-500/50 rounded-xl p-6 text-center shadow-[0_0_30px_rgba(245,158,11,0.2)] animate-in zoom-in duration-500">
                  <Crown className="w-12 h-12 text-amber-400 mx-auto mb-2 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                  <h3 className="text-amber-400 font-black uppercase tracking-widest text-sm mb-1">Grand Champion</h3>
                  {ultimateWinner ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={ultimateWinner.avatar} className="w-16 h-16 rounded-full border-2 border-amber-400 object-cover" alt="Champion" />
                      <span className="text-2xl font-bold text-white">{ultimateWinner.username}</span>
                    </div>
                  ) : (
                    <span className="text-xl font-bold text-white">Winner Decided</span>
                  )}
                </div>
              ) : 
              
              /* STATE 2: FINALS OVER, AWAITING ADMIN TO CLOSE */
              isAdmin && isTournamentOver ? (
                <div className="flex flex-col gap-2">
                  <div className="bg-amber-900/30 border border-amber-500/50 text-amber-400 p-3 rounded-lg text-sm text-center font-bold">
                    {ultimateWinner?.username} is the last hacker standing!
                  </div>
                  <button onClick={handleEndTournament} className="w-full md:w-64 font-black text-gray-900 bg-amber-400 hover:bg-amber-300 rounded-xl py-4 text-xl transition-all shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse">
                    CROWN CHAMPION
                  </button>
                </div>
              ) : 
              
              /* STATE 3: ONGOING TOURNAMENT (Your existing buttons) */
              isAdmin ? (
                <button onClick={handleGenerateMatches} className="w-full md:w-64 font-bold text-gray-900 bg-amber-400 hover:bg-amber-300 rounded-xl py-4 text-xl transition-all shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                  GENERATE ROUND
                </button>
              ) : !hasJoined ? (
                <button onClick={handleJoinTournament} disabled={isJoining} className="w-full md:w-64 font-bold text-gray-900 bg-cyan-400 rounded-xl py-4 text-xl transition-all hover:bg-cyan-300">
                  {isJoining ? "Joining..." : "JOIN TOURNAMENT"}
                </button>
              ) : (
                <div className="w-full md:w-64 text-center py-4 border-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-xl font-bold">
                  {user?.uid && tournament.eliminated?.includes(user.uid) ? "Eliminated 💀" : "Surviving ⚔️"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 border-b border-gray-700/50 mb-6">
          <button onClick={() => setActiveTab('overview')} className={`pb-3 px-4 font-bold text-lg transition-colors ${activeTab === 'overview' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>Overview</button>
          <button onClick={() => setActiveTab('leaderboard')} className={`pb-3 px-4 font-bold text-lg transition-colors ${activeTab === 'leaderboard' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>Participants</button>
          {(isAdmin || matches.length > 0) && (
            <button onClick={() => setActiveTab('matches')} className={`pb-3 px-4 font-bold text-lg transition-colors ${activeTab === 'matches' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-500 hover:text-gray-300'}`}>Brackets</button>
          )}
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            
            {/* Left Column: Details & Rules */}
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-xl">
                <h3 className="text-xl text-cyan-300 mb-4 font-bold flex items-center gap-2">
                  <Calendar size={20} /> Schedule
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Starts</p>
                    <p className="text-white font-medium">{formatDate(tournament.startDate)}</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ends</p>
                    <p className="text-white font-medium">{formatDate(tournament.endDate)}</p>
                  </div>
                </div>
              </section>

              <section className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-xl">
                <h3 className="text-xl text-rose-300 mb-4 font-bold flex items-center gap-2">
                  <ShieldAlert size={20} /> Rules & Guidelines
                </h3>
                <div className="bg-black/30 p-5 rounded-lg border border-rose-900/20 text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">
                  {tournament.rules || "No specific rules provided for this tournament."}
                </div>
              </section>
            </div>

            {/* Right Column: Prizes */}
            <div className="space-y-6">
              <section className="bg-gradient-to-b from-amber-900/20 to-gray-900/40 border border-amber-500/30 p-6 rounded-xl">
                <h3 className="text-xl text-amber-400 mb-6 font-bold flex items-center gap-2 uppercase tracking-widest">
                  <Gift size={20} /> Prize Pool
                </h3>
                <div className="space-y-4">
                  {tournament.prizes && tournament.prizes.length > 0 ? (
                    tournament.prizes.map((prize, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-amber-500/20">
                        <span className="font-black text-amber-500 text-lg w-12">{prize.rank}</span>
                        <span className="text-amber-100 font-medium text-right flex-1">{prize.reward}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic text-sm">Bragging rights only.</p>
                  )}
                </div>
              </section>
            </div>
            
          </div>
        )}

        {/* LEADERBOARD / PARTICIPANTS TAB */}
        {activeTab === 'leaderboard' && (
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden shadow-xl animate-in fade-in duration-300">
            {players.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>No warriors have entered the arena yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/50 border-b border-gray-700/50">
                    <th className="p-4 text-gray-400 font-medium text-sm w-16 text-center">Rank</th>
                    <th className="p-4 text-gray-400 font-medium text-sm">Hacker</th>
                    <th className="p-4 text-gray-400 font-medium text-sm hidden md:table-cell">Skill Tier</th>
                    <th className="p-4 text-gray-400 font-medium text-sm text-right">Rating</th>
                    {/* Extra column header for Admins */}
                    {isAdmin && <th className="p-4 text-gray-400 font-medium text-sm text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => (
                    <tr key={player.uid} className={`border-b border-gray-700/30 transition-colors hover:bg-white/5 ${tournament?.eliminated?.includes(player.uid) ? 'opacity-50 grayscale' : ''} ${player.uid === user?.uid ? 'bg-cyan-900/20' : ''}`}>
                      <td className="p-4 text-center">
                        {index === 0 ? <span className="text-amber-400 font-black text-xl">1</span> :
                         index === 1 ? <span className="text-gray-300 font-black text-lg">2</span> :
                         index === 2 ? <span className="text-amber-700 font-black text-lg">3</span> :
                         <span className="text-gray-500 font-bold">{index + 1}</span>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={player.avatar} alt={player.username} className="w-10 h-10 rounded-md border border-gray-600 object-cover" />
                          <div>
                            <p className={`font-bold ${player.uid === user?.uid ? 'text-cyan-400' : 'text-gray-200'}`}>
                              {player.username} {player.uid === user?.uid && "(You)"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-xs px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-300">
                          {player.skillLevel}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-cyan-300 text-lg">
                        {player.rating}
                      </td>
                      
                      {/* ADMIN KICK BUTTON */}
                      {isAdmin && (
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleRemovePlayer(player.uid, player.username)} 
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/40 bg-red-900/20 px-3 py-1.5 rounded border border-red-500/30 flex items-center gap-2 ml-auto transition-all"
                          >
                            <UserMinus size={14} /> Kick
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.length === 0 ? <p className="text-gray-500">No matches generated yet.</p> : 
              matches.map((match) => (
                <div key={match.id} className="bg-black/50 border border-amber-500/30 p-4 rounded-xl flex flex-col gap-4 relative">
                  <div className="flex justify-between items-center text-sm font-bold text-gray-400 uppercase">
                    <span>Room: {match.roomId}</span>
                    <span className={match.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}>{match.status}</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 bg-gray-800 p-3 rounded-lg text-center font-bold text-cyan-300 truncate">{match.p1.username}</div>
                    <span className="text-gray-600 font-black italic">VS</span>
                    <div className="flex-1 bg-gray-800 p-3 rounded-lg text-center font-bold text-rose-300 truncate">{match.p2 ? match.p2.username : "BYE (Auto-Win)"}</div>
                  </div>

                  {/* ADMIN ONLY: START MATCH */}
                  {isAdmin && match.p2 && match.status === 'pending' && (
                    <button onClick={() => handleStartMatch(match)} className="w-full mt-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-gray-900 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all">
                      <Play size={16} /> Start Match
                    </button>
                  )}
                </div>
              ))
            }
          </div>
        )}

      </div>
    </div>
  );
};

export default TournamentLobby;