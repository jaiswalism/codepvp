import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocket } from "./sockets/index.js";
import "dotenv/config";
import cors from "cors";
import { rooms } from "./store/rooms.js";
import { getVerdict } from "./utils/judge.js";
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const PORT = process.env.PORT || 5000;
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

app.use(express.json());

// Optional: REST routes can be added here
app.get("/api/rooms", (req, res) => res.json(rooms));

app.post("/api/submit", async (req, res) => {
  const sourceCode = req.body.sourceCode;
  const problemId = req.body.problemId;
  const language = req.body.language;
  const result = await getVerdict(sourceCode, problemId, language);
  res.json(result);
});

app.post('/upload-avatar', async (req, res) => {
  try {
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.avatar;

    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'avatars',
      transformation: [
        { width: 300, height: 300, crop: "fill" },
        { quality: "auto" }
      ]
    });

    res.json({ url: result.secure_url });

  } catch (err) {
    console.error(err); // 👈 IMPORTANT
    res.status(500).json({ error: 'Upload failed' });
  }
});

setupSocket(io);

server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`),
);
