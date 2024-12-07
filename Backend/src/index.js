import dotenv from "dotenv";
import { createServer } from "http";

dotenv.config({
    path: "./.env",
});

import connectDB from "./DB/index.js";
import app from "./app.js";

const PORT = 10000;

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        const server = createServer(app);
        
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Please try a different port or kill the process using this port.`);
                process.exit(1);
            } else {
                console.error('Server error:', error);
                process.exit(1);
            }
        });

        server.listen(PORT, () => {
            console.log(`⚙️  Server is running at port: ${PORT}`);
        });

        // Handle graceful shutdown
        const gracefulShutdown = () => {
            console.log("\nReceived shutdown signal. Closing server...");
            server.close(() => {
                console.log("Server closed. Exiting process.");
                process.exit(0);
            });

            // Force close after 10s
            setTimeout(() => {
                console.error("Could not close connections in time, forcefully shutting down");
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (err) {
        console.error("ERROR starting server:", err);
        process.exit(1);
    }
};

startServer();
