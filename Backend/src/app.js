import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:6000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
import userRoutes from "./routes/user.routes.js";
import fileRoutes from "./routes/file.routes.js";

app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.url} not found`,
    });
});

// Error handling middleware
app.use(errorHandler);

export default app;
