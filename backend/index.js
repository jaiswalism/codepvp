// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const rooms = {};
const userToRoom = {};

io.on("connection", (socket) => {

  // This is for joining the room
  socket.on("joinRoom", ({ roomId, username }) => {

    console.log(`User ${username} joined room ${roomId}`);

    const existing = userToRoom[socket.id];
    if (existing && existing.roomId !== roomId) {
      const oldRoom = rooms[existing.roomId];
      if (oldRoom) {
        oldRoom.teamA = oldRoom.teamA.map((p) => (p === existing.username ? null : p));
        oldRoom.teamB = oldRoom.teamB.map((p) => (p === existing.username ? null : p));
        io.to(existing.roomId).emit("roomUpdate", oldRoom);
      }
      socket.leave(existing.roomId);
    }

    if (!rooms[roomId]) {
      rooms[roomId] = { teamA: [null, null], teamB: [null, null] };
    }

    userToRoom[socket.id] = { roomId, username }
    socket.join(roomId);

    // send current state to new user
    io.to(roomId).emit("roomUpdate", rooms[roomId]);
  });

  socket.on("joinSlot", ({ roomId, team, slotIndex, username }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { teamA: [null, null], teamB: [null, null] };
    }

    const room = rooms[roomId];

    // 1. Prevent duplicates — remove user from all slots before placing them
    room.teamA = room.teamA.map((p) => (p === username ? null : p));
    room.teamB = room.teamB.map((p) => (p === username ? null : p));

    // 2. Put them in the requested slot if it's empty
    const targetTeam = team === "A" ? room.teamA : room.teamB;

    if (targetTeam[slotIndex] === null) {
        targetTeam[slotIndex] = username;
    }

    userToRoom[socket.id] = { roomId, username }
    socket.join(roomId)

    // 3. Broadcast updated state
    io.to(roomId).emit("roomUpdate", room);
    });
  
  socket.on("joinProblemRoom", ({roomId, problemId, username}) => {
    socket.join(problemId);
    console.log(`${username} joined ${problemId} in room ${roomId}`);
  });

  socket.on("editorChange", ({ roomId, problemId, code }) => {
    // Broadcast to everyone else in the same room/problem
    socket.to(problemId).emit("editorUpdate", { code });
  });

  socket.on("disconnect", () => {
    // Cleanup
    const data = userToRoom[socket.id];
    if(!data) return;

    const { roomId, username } = data;

    console.log("❌ Disconnected:", username, "From room:", roomId);

    const room = rooms[roomId];
    if(!room) return;

    // Remove user
    room.teamA = room.teamA.map((p) => (p === username ? null : p));
    room.teamB = room.teamB.map((p) => (p === username ? null : p));

    delete userToRoom[socket.id];

    io.to(roomId).emit("roomUpdate", room);
  });
});

server.listen(4000, () => console.log("🚀 Server running on :4000"));
