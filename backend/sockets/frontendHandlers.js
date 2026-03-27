import {
    activeTimers,
    frontendQueue,
    frontendRooms,
    frontendUserToRoom,
} from "../store/rooms.js";

const PVP_TOPICS = [
    "Design a modern cafe landing page",
    "Build a secure login screen for a banking app",
    "Create a futuristic analytics dashboard",
    "Design a minimal portfolio for yourself",
    "Build a checkout cart UI for an e-commerce store"
];

export function frontendHandlers(io, socket) {
    socket.on("joinFrontendQueue", async ({ username }) => {
        if (!username || frontendQueue.includes(username)) return;

        frontendQueue.push(username);
        console.log("here is ", frontendQueue);

        await tryMatch(io);
    });

    socket.on("leaveFrontendQueue", ({ username }) => {
        if (!username) return;
        removeFromQueue(username);
    });

    socket.on("joinFrontendRoom", ({ roomId, username }) => {
        if (!roomId || !username) return;

        const room = frontendRooms[roomId];
        if (!room) return;

        if (!room.players.includes(username)) {
            room.players.push(username);
        }

        if (!room.playerFiles[username]) {
            room.playerFiles[username] = createDefaultFiles();
        }

        socket.username = username;
        socket.frontendRoomId = roomId;
        frontendUserToRoom[username] = roomId;

        console.log(room);

        socket.join(roomId);

        socket.emit("frontendRoomState", {
            roomId,
            endTime: room.endTime,
            files: room.playerFiles[username],
            players: room.players,
            topic: room.topic,
        });
    });

    socket.on("frontendCodeChange", ({ roomId, username, path, code }) => {
        if (!roomId || !username || !path || typeof code !== "string") return;

        const room = frontendRooms[roomId];
        if (!room || !room.players.includes(username)) return;

        if (!room.playerFiles[username]) {
            room.playerFiles[username] = createDefaultFiles();
        }

        room.playerFiles[username][path] = code;
        room.updatedAt = Date.now();
        console.log(room.playerFiles[username][path])
    });

    socket.on("frontendFilesSync", ({ roomId, username, files }) => {
        if (!roomId || !username || !files || typeof files !== "object") return;

        const room = frontendRooms[roomId];
        if (!room || !room.players.includes(username)) return;

        const sanitized = sanitizeFiles(files);
        if (!room.playerFiles[username]) {
            room.playerFiles[username] = createDefaultFiles();
        }

        room.playerFiles[username] = {
            ...room.playerFiles[username],
            ...sanitized,
        };
        room.updatedAt = Date.now();
        console.log(room.playerFiles[username])
    });

    socket.on("getShowcaseData", ({ roomId }) => {
        const room = frontendRooms[roomId];
        if (room && room.status === "voting") {
            socket.emit("showcaseDataPayload", {
                topic: room.topic,
                players: room.players,
                playerFiles: room.playerFiles 
            });
        }
    });

    socket.on("disconnect", () => {
        const username = socket.username;
        if (!username) return;

        removeFromQueue(username);
    });

    socket.on('getFrontendMatchDetails', ({ roomId }) => {
        const room = frontendRooms[roomId];
        if (room) {
            // Send the endTime back to the specific user who asked
            socket.emit("frontendMatchDetails", { endTime: room.endTime });
        }
    });

    socket.on("submitVotes", ({ roomId, voter, votes }) => {
        const room = frontendRooms[roomId];
        
        // Safety checks
        if (!room || room.status !== "voting") return;
        if (room.votesReceivedFrom.includes(voter)) return; // Prevent double voting

        // Mark this player as having voted
        room.votesReceivedFrom.push(voter);

        // Tally up the scores they gave to the other players
        // 'votes' looks like: { "playerB": 8, "playerC": 5, "playerD": 10 }
        for (const [targetPlayer, score] of Object.entries(votes)) {
            if (room.playerScores[targetPlayer] && score > 0) {
                room.playerScores[targetPlayer].total += score;
                room.playerScores[targetPlayer].count += 1;
            }
        }

        // CHECK IF EVERYONE HAS VOTED
        if (room.votesReceivedFrom.length === room.players.length) {
            
            // Calculate final averages
            const leaderboard = room.players.map(player => {
                const stats = room.playerScores[player];
                // Avoid dividing by zero if someone got no valid votes
                const average = stats.count > 0 ? (stats.total / stats.count).toFixed(1) : "0.0";
                
                return {
                    username: player,
                    score: parseFloat(average)
                };
            });

            // Sort from highest score to lowest
            leaderboard.sort((a, b) => b.score - a.score);

            // Broadcast the results to everyone still on the voting page!
            io.to(roomId).emit("frontendMatchResults", { leaderboard });

            // Now it is finally safe to destroy the room
            delete frontendRooms[roomId];
        }
    });
}

async function tryMatch(io) {
    if (frontendQueue.length < 4) return;

    const p1 = frontendQueue.shift();
    const p2 = frontendQueue.shift();
    const p3 = frontendQueue.shift();
    const p4 = frontendQueue.shift();

    if (!p1 || !p2 || !p3 || !p4) return;

    const time = 15;
    const durationMs = time * 60 * 1000;

    const frontendRoomData = createRoom(p1, p2, p3, p4, time);
    const { roomId, endTime } = frontendRoomData;

    const timerId = setTimeout(() => {
        io.to(roomId).emit("frontendMatchEnd", { reason: "time_up" });

        if (frontendRooms[roomId]) {
            frontendRooms[roomId].status = "voting";
        }

        activeTimers.delete(roomId);

        setTimeout(() => {
            delete frontendRooms[roomId];
        }, 10 * 60 * 1000);
    }, durationMs);

    activeTimers.set(roomId, timerId);

    [p1, p2, p3, p4].forEach((player) => {
        frontendUserToRoom[player] = roomId;
        io.to(player).emit("frontendMatchFound", {
            roomId,
            endTime,
        });
    });
}

function createRoom(p1, p2, p3, p4, time) {
    const roomId = generateRoomCode();
    const startTime = Date.now();
    const endTime = startTime + time * 60 * 1000;

    const selectedTopic = PVP_TOPICS[Math.floor(Math.random() * PVP_TOPICS.length)];

    frontendRooms[roomId] = {
        status: "in-progress",
        topic: selectedTopic,
        players: [p1, p2, p3, p4],
        playerFiles: {
            [p1]: createDefaultFiles(),
            [p2]: createDefaultFiles(),
            [p3]: createDefaultFiles(),
            [p4]: createDefaultFiles(),
        },
        votesReceivedFrom: [],
        playerScores: {
            [p1]: { total: 0, count: 0 },
            [p2]: { total: 0, count: 0 },
            [p3]: { total: 0, count: 0 },
            [p4]: { total: 0, count: 0 },
        },
        startTime,
        endTime,
        updatedAt: startTime,
    };

    return {
        roomId,
        startTime,
        endTime,
    };
}

function generateRoomCode() {
    let roomId = Math.floor(100000 + Math.random() * 900000).toString();

    while (frontendRooms[roomId]) {
        roomId = Math.floor(100000 + Math.random() * 900000).toString();
    }

    return roomId;
}

function removeFromQueue(username) {
    const idx = frontendQueue.indexOf(username);
    if (idx >= 0) {
        frontendQueue.splice(idx, 1);
    }
}

function sanitizeFiles(files) {
    const out = {};

    Object.entries(files).forEach(([path, value]) => {
        if (typeof path !== "string") return;

        if (typeof value === "string") {
            out[path] = value;
            return;
        }

        if (value && typeof value === "object" && typeof value.code === "string") {
            out[path] = value.code;
        }
    });

    return out;
}

function createDefaultFiles() {
    return {
        "/App.js": "export default function App() {\n  return <h1>Hello PixelPvP</h1>;\n}\n",
    };
}