import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes.js';
import electionRoutes from './routes/electionRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import ballotRoutes from './routes/ballotRoutes.js';
import positionRoutes from './routes/positionRoutes.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET not configured");
    process.exit(1);
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(helmet());

app.set('io', io);

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
});

const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/elections`, electionRoutes);
app.use(`${API_PREFIX}/candidates`, candidateRoutes);
app.use(`${API_PREFIX}/ballot`, ballotRoutes);
app.use(`${API_PREFIX}/positions`, positionRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to the database"))
    .catch((err) => console.error("Database connection error:", err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`The server is running at PORT ${PORT}`));
export default app;