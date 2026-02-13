export function editorHandlers(io, socket) {
  socket.on("joinProblemRoom", ({ roomId, teamId, problemId, username }) => {
    socket.join(`${roomId}-team-${teamId}-problem-${problemId}`);
  });

  socket.on("editorChange", ({ roomId, teamId, problemId, code, source }) => {
    io.to(`${roomId}-team-${teamId}-problem-${problemId}`).emit("editorUpdate", { code, source });
  });

  socket.on("markSolved", ({ roomId, teamId, problemId, username }) => {
    io.to(`${roomId}-team-${teamId}`).emit("solvedProblem", { problemId, teamId, username });
  });

  socket.on("joinProblemset", ({ roomId, teamId }) => {
    socket.join(`${roomId}-team-${teamId}`);
  });
}
