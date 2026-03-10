import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { limiter } from "../middleware/rateLimiter.js";
import authRoutes from "../routes/authRoutes.js";
import User from "../models/userSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/v1/auth", authRoutes);

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe("Auth API", () => {
  test("should register a new user", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Test User",
        studentId: "20249999",
        password: "password123",
        department: "DCS",
        yearLevel: 2,
        role: "voter"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.student.studentId).toBe("20249999");
  });

  test("should reject signup with missing fields", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Test User",
        studentId: "20240000"
      });

    expect(res.statusCode).toBe(400);
  });

  test("should reconnect existing user", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await User.create({
      name: "Existing User",
      studentId: "20240001",
      password: hashedPassword,
      department: "DCS",
      yearLevel: 2,
      role: "voter"
    });

    const res = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        name: "Existing User",
        studentId: "20240001",
        password: "password123",
        department: "DCS",
        yearLevel: 2,
        role: "voter"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User reconnected");
  });

  test("should login a user", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await User.create({
      name: "Login User",
      studentId: "20249998",
      password: hashedPassword,
      department: "DCS",
      yearLevel: 2,
      role: "voter"
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        studentId: "20249998",
        password: "password123"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("should reject invalid login", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await User.create({
      name: "Login User",
      studentId: "20249997",
      password: hashedPassword,
      department: "DCS",
      yearLevel: 2,
      role: "voter"
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        studentId: "20249997",
        password: "wrongpassword"
      });

    expect(res.statusCode).toBe(401);
  });

  test("login returns a valid JWT", async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await User.create({
      name: "JWT User",
      studentId: "20249996",
      password: hashedPassword,
      department: "DCS",
      yearLevel: 2,
      role: "voter"
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        studentId: "20249996",
        password: "password123"
      });

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.userId).toBe(user._id.toString());
    expect(decoded.role).toBe("voter");
  });

  test("should bulk signup multiple users", async () => {
    const users = [
      { name: "User1", studentId: "20240002", password: "pass", department: "DIS", yearLevel: 1, role: "voter" },
      { name: "User2", studentId: "20240003", password: "pass", department: "DCS", yearLevel: 2, role: "voter" },
    ];

    const res = await request(app)
      .post("/api/v1/auth/signup/bulk")
      .send(users);

    expect(res.statusCode).toBe(201);
    expect(res.body.count).toBe(2);
  });
});