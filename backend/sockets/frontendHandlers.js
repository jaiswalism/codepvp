import {
    activeTimers,
    frontendQueue,
    frontendRooms,
    frontendUserToRoom,
} from "../store/rooms.js";

export function frontendHandlers(io, socket) {
    socket.on("joinFrontendQueue", async ({ username }) => {
        if (!username || frontendQueue.includes(username)) return;

        frontendQueue.push(username);
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

        socket.join(roomId);

        socket.emit("frontendRoomState", {
            roomId,
            endTime: room.endTime,
            files: room.playerFiles[username],
            players: room.players,
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
    });

    socket.on("disconnect", () => {
        const username = socket.username;
        if (!username) return;

        removeFromQueue(username);
    });
}

async function tryMatch(io) {
    if (frontendQueue.length < 4) return;

    const p1 = frontendQueue.shift();
    const p2 = frontendQueue.shift();
    const p3 = frontendQueue.shift();
    const p4 = frontendQueue.shift();

    if (!p1 || !p2 || !p3 || !p4) return;

    const frontendRoomData = createRoom(p1, p2, p3, p4);
    const { roomId, endTime } = frontendRoomData;

    const time = 15;
    const durationMs = time * 60 * 1000;

    const timerId = setTimeout(() => {
        io.to(roomId).emit("frontendMatchEnd", { reason: "time_up" });
        delete frontendRooms[roomId];
        activeTimers.delete(roomId);
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

function createRoom(p1, p2, p3, p4) {
    const roomId = generateRoomCode();
    const time = 15;
    const startTime = Date.now();
    const endTime = startTime + time * 60 * 1000;

    frontendRooms[roomId] = {
        status: "in-progress",
        players: [p1, p2, p3, p4],
        playerFiles: {
            [p1]: createDefaultFiles(),
            [p2]: createDefaultFiles(),
            [p3]: createDefaultFiles(),
            [p4]: createDefaultFiles(),
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