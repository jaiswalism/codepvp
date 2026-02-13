import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocket } from "./sockets/index.js";
import 'dotenv/config';
import cors from "cors";
import { rooms } from "./store/rooms.js";
import { getVerdict } from "./utils/judge.js";

const PORT = process.env.PORT || 5000;
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Optional: REST routes can be added here
app.get("/api/rooms", (req, res) => res.json(rooms));

app.post("/api/submit", async (req, res) => {
  const sourceCode = req.body.sourceCode;
  const problemId = req.body.problemId;
  const language = req.body.language;
  const result = await getVerdict(sourceCode, problemId, language);
  res.json({
    result: result
  })
})

setupSocket(io);

server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
