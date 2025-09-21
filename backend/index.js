import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from 'redis';
import 'dotenv/config';

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-18903.c8.us-east-1-2.ec2.redns.redis-cloud.com',
        port: 18903
    }
});

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

// await client.set('foo', 'bar');
// const result = await client.get('foo');
// console.log(result)  // >>> bar
// await client.del('foo');

const PORT = process.env.PORT || "4000";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const rooms = {};
const userToRoom = {};
const activeTimers = new Map();

io.on("connection", (socket) => {

  // This is for joining the room
  socket.on("joinRoom", ({ roomId, username }) => {

    console.log(`User ${username} joined room ${roomId}`);

    socket.username = username;
    socket.roomId = roomId;

    const existing = userToRoom[username];
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

    userToRoom[username] = { roomId }
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

    userToRoom[username] = { roomId, username }
    socket.join(roomId)

    // 3. Broadcast updated state
    io.to(roomId).emit("roomUpdate", room);
  });

  socket.on("startGame", ({ roomId }) => {
    const room = rooms[roomId]
    if(!room || room.status === 'in-progress') return;

    room.status = 'in-progress';
    room.duration = 1800; // 30 minutes in seconds
    room.startTime = Date.now();
    room.endTime = room.startTime + (room.duration * 1000);

    // --- ADD TEAM-SPECIFIC FINISH TRACKING ---
    room.teamAFinishedTime = null;
    room.teamBFinishedTime = null;

    const timerId = setTimeout(() => {
        console.log(`Timer finished for room ${roomId}`);
        io.to(roomId).emit("matchEnd", { reason: "time_up" });
        activeTimers.delete(roomId); 
    }, room.duration * 1000);

    activeTimers.set(roomId, timerId);

    io.to(roomId).emit("navigateToProblemset", { roomId, room })
  });

  socket.on("getMatchDetails", ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.endTime) {
        socket.emit("matchDetails", { endTime: room.endTime });
    }
});
  
  socket.on("joinProblemRoom", ({roomId, teamId, problemId, username}) => {
    socket.join(`${roomId}-team-${teamId}-problem-${problemId}`);
    console.log(`${username} joined ${problemId} in room ${roomId}`);
  });

  socket.on("editorChange", ({ roomId, teamId, problemId, code, source }) => {
    // Broadcast to everyone else in the same room/problem
    io.to(`${roomId}-team-${teamId}-problem-${problemId}`).emit("editorUpdate", { code, source });
  });

  socket.on("joinProblemset", ({ roomId, teamId }) => {
    socket.join(`${roomId}-team-${teamId}`);
  });

  socket.on("markSolved", ({ roomId, teamId, problemId }) => {
    io.to(`${roomId}-team-${teamId}`).emit("solvedProblem", { problemId, teamId });
  });

socket.on("finishGame", ({ roomId, teamId }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'in-progress') return;

    const finishTime = Date.now();
    if (teamId === 'A') {
        room.teamAFinishedTime = finishTime;
    } else {
        room.teamBFinishedTime = finishTime;
    }

    console.log(`Team ${teamId} in room ${roomId} finished at ${finishTime}.`);

    io.to(roomId).emit("teamFinishedUpdate", { 
        teamId: teamId, 
        finishTime: finishTime 
    });

    // Check if both teams have finished to end early
    if (room.teamAFinishedTime && room.teamBFinishedTime) {
        const timerId = activeTimers.get(roomId);
        if (timerId) {
            clearTimeout(timerId);
            activeTimers.delete(roomId);
        }
        io.to(roomId).emit("matchEnd", { reason: "both_teams_finished" });
    }
});

  socket.on("disconnectRoom", ({ username, roomId }) => {
    // Cleanup
    const room = rooms[roomId];
    if(!room) return;

    console.log("❌ Disconnected:", username, "from Room:", roomId);

    // Remove user
    room.teamA = room.teamA.map((p) => (p === username ? null : p));
    room.teamB = room.teamB.map((p) => (p === username ? null : p));

    delete userToRoom[username];

    io.to(roomId).emit("roomUpdate", room);
  });

  socket.on("disconnect", () => {
    // Cleanup
    const username = socket.username;
    if(!username) return;

    const data = userToRoom[username];
    if(!data) return;

    const { roomId } = data;

    console.log("❌ Disconnected:", username);

    const room = rooms[roomId];
    if(!room) return;

    // Remove user
    room.teamA = room.teamA.map((p) => (p === username ? null : p));
    room.teamB = room.teamB.map((p) => (p === username ? null : p));

    delete userToRoom[username];
    io.to(roomId).emit("roomUpdate", room);
  });

});

server.listen(PORT, () => console.log(`🚀 Server running on :${PORT}`));
