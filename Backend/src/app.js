import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ApiResponse } from "./utils/ApiResponse.js";

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
    'http://localhost:5176',
    process.env.FRONTEND_URL || '*'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

// Increase payload limits for large file uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
import userRoutes from "./routes/user.routes.js";
import fileRoutes from "./routes/file.routes.js";

app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);

// 404 handler should be after routes but before error handler
app.use((req, res) => {
    res.status(404).json(new ApiResponse(
        404,
        null,
        `Route ${req.url} not found`
    ));
});

// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    res.status(statusCode).json(new ApiResponse(
        statusCode,
        null,
        message,
        err.errors || []
    ));
});

// Error handling middleware
app.use(errorHandler);

export default app;
