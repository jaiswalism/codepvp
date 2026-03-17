import { useState, useEffect } from 'react';
import { socket } from '../utils/socket';

export const useFrontendTimer = (roomId: string | undefined) => {
  const [timeLeft, setTimeLeft] = useState("Loading...");
  const [isMatchOver, setIsMatchOver] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    let intervalId: NodeJS.Timeout;

    // Ask the server for the room details when the component mounts
    socket.emit("getFrontendMatchDetails", { roomId });

    // 1. Listen for the match details to get the endTime
    const handleMatchDetails = ({ endTime }: { endTime: number }) => {
      // Clear any existing intervals just in case
      if (intervalId) clearInterval(intervalId);

      intervalId = setInterval(() => {
        const remaining = Math.max(0, endTime - Date.now());

        if (remaining === 0) {
          setTimeLeft("00:00");
          setIsMatchOver(true);
          clearInterval(intervalId);
          return;
        }

        const minutes = String(Math.floor(remaining / 60000)).padStart(2, '0');
        const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
        setTimeLeft(`${minutes}:${seconds}`);
      }, 500);
    };

    // 2. Listen for the server explicitly ending the match
    const handleMatchEnd = ({ reason }: { reason: string }) => {
      if (reason === "time_up") {
        setTimeLeft("00:00");
      }
      setIsMatchOver(true);
      if (intervalId) clearInterval(intervalId);
    };

    socket.on("frontendMatchDetails", handleMatchDetails);
    socket.on("frontendMatchEnd", handleMatchEnd);

    return () => {
      if (intervalId) clearInterval(intervalId);
      socket.off("frontendMatchDetails", handleMatchDetails);
      socket.off("frontendMatchEnd", handleMatchEnd);
    };
  }, [roomId]);

  return { timeLeft, isMatchOver };
};