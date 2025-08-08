import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send("Request recieved!!! ")
})

app.listen(PORT, () => console.log(`Server running on port ${PORT} i.e. http://localhost:${PORT}`));
