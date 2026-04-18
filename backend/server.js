import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import { Server } from 'socket.io';
import compression from 'compression';
import authRoutes from './routes/authRoutes.js';
import electionRoutes from './routes/electionRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import ballotRoutes from './routes/ballotRoutes.js';
import positionRoutes from './routes/positionRoutes.js';

dotenv.config();

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
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

app.set('socketio', io);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'"],
        },
    },
}));

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
});

const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/elections`, electionRoutes);
app.use(`${API_PREFIX}/candidates`, candidateRoutes);
app.use(`${API_PREFIX}/ballots`, ballotRoutes);
app.use(`${API_PREFIX}/positions`, positionRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(() => process.exit(1));

export default app;