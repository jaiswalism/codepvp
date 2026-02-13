import { queue } from "../store/rooms";

export function matchmakingHandlers(io, socket) {
    socket.on("joinQueue", ({ username }) => {
        // prevent duplicates
        if (queue.includes(username)) return;

        queue.push(username);

        tryMatch();
    });
}

function tryMatch() {
    if (queue.length >= 2) {
    const p1 = queue.shift();
    const p2 = queue.shift();

    const roomSettings = createRoom(p1, p2);

    io.to(p1).emit("matchFound", { roomId });
    io.to(p2).emit("matchFound", { roomId });
  }
}