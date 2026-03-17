import { db, admin } from "../firebaseAdmin.js";

import { queue, activeTimers, rooms } from "../store/rooms.js";

export function matchmakingHandlers(io, socket) {

  socket.on("joinQueue", async ({ username }) => {

    // prevent duplicates
    if (queue.includes(username)) return;

    queue.push(username);
    console.log(queue);

    await tryMatch(io);
  });

}

async function tryMatch(io) {

  if (queue.length < 2) return;

  const p1 = queue.shift();
  const p2 = queue.shift();

  const roomData = await createRoom(p1, p2);
  const { roomId, teamMap, endTime } = roomData;

  const time = 15; // same value used in createRoom
const durationMs = time * 60 * 1000;

  // Start timer immediately
  const timerId = setTimeout(() => {
    io.to(roomId).emit("matchEnd", { reason: "time_up" });
    activeTimers.delete(roomId);
  }, durationMs);

  activeTimers.set(roomId, timerId);

  // Make sockets join the room channel
  io.sockets.sockets.forEach((s) => {
    if (s.rooms.has(p1) || s.rooms.has(p2)) {
      s.join(roomId);
    }
  });

  io.to(p1).emit("matchFound", {
    roomId,
    team: teamMap[p1],
    endTime
  });

  io.to(p2).emit("matchFound", {
    roomId,
    team: teamMap[p2],
    endTime
  });
}



async function createRoom(p1, p2) {

  const roomId = generateRoomCode();

  const difficulty = "Easy";
  const questions = 4;
  const time = 15;

  const startTime = Date.now();
  const endTime = startTime + time * 60 * 1000;

  // Randomize teams
  const players = [p1, p2].sort(() => Math.random() - 0.5);

  const teamAPlayer = players[0];
  const teamBPlayer = players[1];

  // 1️⃣ Create rooms doc
  await db.collection("rooms").doc(roomId).set({
    difficulty,
    size: "1v1",
    questions,
    time,
    public: false,
    status: "in-progress",
    owner: p1,
    startTime,
    endTime,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 2️⃣ Fetch problems
  const snapshot = await db.collection("ProblemsWithHTC")
    .where("difficulty", "==", difficulty)
    .get();

  const allProblems = snapshot.docs.map(doc => ({
    id: doc.id,
    statusA: 0,
    statusB: 0,
    ...doc.data()
  }));

  const shuffled = allProblems.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, questions);

  // 3️⃣ Create RoomSet
  await db.collection("RoomSet").doc(roomId).set({
    winningTeam: null,
    teamA: {
      name: "Team A",
      score: 0,
      players: [{
        pid: teamAPlayer,
        problemsSolved: 0,
        points: 0
      }],
      solvedProblems: []
    },
    teamB: {
      name: "Team B",
      score: 0,
      players: [{
        pid: teamBPlayer,
        problemsSolved: 0,
        points: 0
      }],
      solvedProblems: []
    },
    allProblems: selected,
    startedAt: startTime,
    endTime
  });

  rooms[roomId] = {
    status: "in-progress",
    teamA: [{ pid: teamAPlayer, ready: true }],
    teamB: [{ pid: teamBPlayer, ready: true }],
    owner: p1,
    startTime,
    endTime,
    duration: time * 60,
    teamAFinishedTime: null,
    teamBFinishedTime: null
    };

  return {
    roomId,
    teamMap: {
      [teamAPlayer]: "A",
      [teamBPlayer]: "B"
    },
    startTime,
    endTime,
  };
}


function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


