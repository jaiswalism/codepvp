import { frontendRooms, frontendQueue, activeTimers } from "../store/rooms.js";

export function frontendHandlers(io, socket) {
    socket.on('joinFrontendQueue', async ({username}) => {

        // prevent duplicates
        if (frontendQueue.includes(username)) return;

        frontendQueue.push(username);

        console.log("here is ", frontendQueue);

        await tryMatch(io);

    });

    socket.on('getFrontendMatchDetails', ({ roomId }) => {
        const room = frontendRooms[roomId];
        if (room) {
            // Send the endTime back to the specific user who asked
            socket.emit("frontendMatchDetails", { endTime: room.endTime });
        }
    });
}

async function tryMatch(io) {
    if (frontendQueue.length < 4) return;

    const p1 = frontendQueue.shift();
    const p2 = frontendQueue.shift();
    const p3 = frontendQueue.shift();
    const p4 = frontendQueue.shift();

    const time = 15;
    const durationMs = time * 60 * 1000;

    const frontendRoomData = createRoom(p1, p2, p3, p4, time);
    const { roomId, endTime } = frontendRoomData;

    const timerId = setTimeout(() => {
        io.to(roomId).emit("frontendMatchEnd", { reason: "time_up" });
        activeTimers.delete(roomId);
    }, durationMs);

    activeTimers.set(roomId, timerId);

    // Make sockets join the room channel
    io.sockets.sockets.forEach((s) => {
        if (s.rooms.has(p1) || s.rooms.has(p2) || s.rooms.has(p3) || s.rooms.has(p4)) {
        s.join(roomId);
        }
    });

    io.to(p1).emit("frontendMatchFound", {
        roomId,
        endTime
    });

    io.to(p2).emit("frontendMatchFound", {
        roomId,
        endTime
    });

    io.to(p3).emit("frontendMatchFound", {
        roomId,
        endTime
    });

    io.to(p4).emit("frontendMatchFound", {
        roomId,
        endTime
    });
}

function createRoom(p1, p2, p3, p4, time) {
    const roomId = generateRoomCode();
    const startTime = Date.now();
    const endTime = startTime + time * 60 * 1000;

    frontendRooms[roomId] = {
        roomId,
        endTime,
        players: [p1, p2, p3, p4]
    };

    return { roomId, endTime }
}

function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}