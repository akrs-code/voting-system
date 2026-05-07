import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many requests. Please try again in 10 minutes."
  }
});