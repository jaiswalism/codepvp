export function frontendHandlers(io, socket) {
    socket.on('joinFrontendQueue', async ({username}) => {

        // prevent duplicates
        if (queue.includes(username)) return;

        queue.push(username);

        await tryMatch(io);

    })
}

async function tryMatch(io) {
    if (queue.length < 4) return;

    const p1 = queue.shift();
    const p2 = queue.shift();
    const p3 = queue.shift();
    const p4 = queue.shift();

    const frontendRoomData = createRoom(p1, p2, p3, p4);
    const { roomId, endTime } = frontendRoomData;

    const time = 15;
    const durationMs = time * 60 * 1000;

    const timerId = setTimeout(() => {
        io.to(roomId).emit("frontendMatchEnd", { reason: "time_up" });
        activeTimers.delete(roomId);
    }, durationMs);

    activeTimers.set(roomId, timerId);
}