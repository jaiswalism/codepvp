import { rooms } from '../store/rooms.js';

// Helper to infer team ('A' or 'B') for a username in a room
function inferTeamForUser(room, username) {
  if (!room || !username) return null;
  const a = room.teamA || [];
  const b = room.teamB || [];
  if (a.some(p => p && (p.pid === username || p === username))) return 'A';
  if (b.some(p => p && (p.pid === username || p === username))) return 'B';
  return null;
}

export function chatHandlers(io, socket) {

  socket.on('joinChat', ({ roomId, teamId, username }) => {
    if (!roomId) return;

    // ensure we always join the room-level channel
    socket.join(`chat-${roomId}`);

    // fallback username to socket.username if not provided
    const user = username || socket.username;

    // if no teamId provided, try to infer from room membership
    let team = teamId;
    if (!team) {
      const room = rooms[roomId] || {};
      const inferred = inferTeamForUser(room, user);
      if (inferred) team = inferred;
    }

    if (team) {
      socket.join(`chat-${roomId}-team-${team}`);
    }

    const room = rooms[roomId] || {};
    // if this is a team chat, emit only team history
    if (team) {
      const teamMessages = (room.teamChats && room.teamChats[team]) || [];
      socket.emit('chatHistory', { scope: 'team', roomId, teamId: team, messages: teamMessages });
      return;
    }

    // otherwise, emit room history
    const roomMessages = room.chats || [];
    socket.emit('chatHistory', { scope: 'room', roomId, messages: roomMessages });
  });

  socket.on('chatMessage', ({ roomId, teamId, username, text }) => {
    if (!roomId || !text) return;

    // fallback username to socket.username
    const user = username || socket.username;

    // ensure room exists in shared store
    rooms[roomId] = rooms[roomId] || {};
    const room = rooms[roomId];

    // If teamId not provided, try to infer from membership
    let team = teamId;
    if (!team) {
      const inferred = inferTeamForUser(room, user);
      if (inferred) team = inferred;
    }

    const msg = { username: user, text, ts: Date.now() };

    // if this is a team message, store only in teamChats
    if (team) {
      room.teamChats = room.teamChats || {};
      room.teamChats[team] = room.teamChats[team] || [];
      room.teamChats[team].push(msg);
      if (room.teamChats[team].length > 500) room.teamChats[team].shift();
      io.to(`chat-${roomId}-team-${team}`).emit('chatMessage', { scope: 'team', roomId, teamId: team, message: msg });
      return;
    }

    // otherwise store room-level chats
    room.chats = room.chats || [];
    room.chats.push(msg);
    if (room.chats.length > 500) room.chats.shift();
    io.to(`chat-${roomId}`).emit('chatMessage', { scope: 'room', roomId, message: msg });
  });
}