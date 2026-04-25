/** @format */

import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import routes from "./routes";

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ─── CORS ─────────────────────────────────────────────────────────────────────

const corsOptions: cors.CorsOptions = {
    origin: process.env.CLIENT_URL ?? "http://localhost:5000",
    credentials: true,
};

app.use(cors(corsOptions));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use("/api/v1", routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[GlobalErrorHandler]", err);
    res.status(500).json({
        success: false,
        message: err.message ?? "Internal server error",
    });
});

export default app;
