import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

type PlayerSlotProps = {
    player: string | null;
    onJoin: () => void;
    currentUserId: string;
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({ player, onJoin, currentUserId }) => {
  if (player) {
    return (
      <div className="h-16 flex items-center justify-center bg-gray-800/50 border border-gray-700 rounded-lg">
        <span className="text-white text-lg truncate px-4">{player === currentUserId ? "You" : player}</span>
      </div>
    );
  }

  return (
    <button 
      onClick={onJoin}
      className="h-16 flex items-center justify-center bg-transparent border-2 border-dashed border-gray-600 rounded-lg
      text-gray-500 hover:bg-gray-700/50 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300"
    >
      + Join Slot
    </button>
  );
};

const RoomPage: React.FC = () => {
  const [teamA, setTeamA] = useState<(string | null)[]>([null, null]);
  const [teamB, setTeamB] = useState<(string | null)[]>([null, null]);
  const { roomId } = useParams();

  //getting firebase user
  const { user } = useAuth();
  
  // Placeholder for the current user's ID
  const currentUserName = user?.displayName || user?.email || "Anon";

  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {

    const socket = io(import.meta.env.VITE_BACKEND_URL, {
      query: { roomId, currentUserName },
    });
    setSocket(socket);

    socket.emit("joinRoom", {roomId, username: currentUserName});

    socket.on("roomUpdate", (room: { teamA: (string | null)[], teamB: (string | null)[] }) => {
      setTeamA(room.teamA);
      setTeamB(room.teamB);
    });

    return () => {
        socket.emit("disconnectRoom", { currentUserName })
        socket.disconnect();
        socket.off("roomUpdate");
    }

  }, [roomId, currentUserName]);

  const handleJoinSlot = (team: 'A' | 'B', slotIndex: number) => {
    socket.emit("joinSlot", {
      roomId,
      team,
      slotIndex,
      username: currentUserName,
    });

  };

  return (
    <div className='bg-gray-900 flex justify-center items-center h-dvh w-dvw ' >
    <div className="z-10 flex flex-col p-8 max-w-5xl w-full
      bg-black/30 backdrop-blur-md 
      border border-cyan-400/20 rounded-xl
      shadow-2xl shadow-cyan-500/10">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <div>
            <h2 className="text-4xl font-bold text-cyan-300" style={{ textShadow: `0 0 8px #0ff` }}>Room Lobby</h2>
            <p className="text-purple-300">Room Code: <span className="font-bold text-white tracking-widest">{ roomId }</span></p>
        </div>
        <Link to="/MultiPlayer" >
        <button className="text-red-400 hover:text-white transition-colors duration-300 text-lg flex items-center gap-2">
          Leave Room
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
        </Link>
      </div>

      {/* Teams Layout */}
      <div className="w-full grid grid-cols-2 gap-8 mb-6">
        {/* Team A */}
        <div>
          <h3 className="text-2xl font-bold text-cyan-400 mb-4 text-center">Team A</h3>
          <div className="flex flex-col gap-4">
            {teamA.map((player, index) => (
              <PlayerSlot 
                key={index} 
                player={player} 
                onJoin={() => handleJoinSlot("A", index)}  
                currentUserId={currentUserName}
              />
            ))}
          </div>
        </div>
        
        {/* Team B */}
        <div>
          <h3 className="text-2xl font-bold text-purple-400 mb-4 text-center">Team B</h3>
           <div className="flex flex-col gap-4">
            {teamB.map((player, index) => (
              <PlayerSlot 
                key={index} 
                player={player} 
                onJoin={() => handleJoinSlot("B", index)}  
                currentUserId={currentUserName}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Start Game Button */}
      <button className="w-full max-w-xs mx-auto font-bold text-gray-900 bg-green-400 border-2 border-green-400 rounded-lg py-3 text-xl
        transition-all duration-300 transform hover:scale-105
        hover:bg-transparent hover:text-green-300
        hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!teamA.every(p => p) || !teamB.every(p => p)}
      >
        Start Game
      </button>

    </div>
    </div>
  );
};

export default RoomPage;