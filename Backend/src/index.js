import dotenv from "dotenv";
import { createServer } from "http";

dotenv.config({
    path: "./.env",
});

import connectDB from "./DB/index.js";
import app from "./app.js";

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Try different ports starting from the default
        const startPort = parseInt(process.env.PORT) || 4001;
        const maxPortAttempts = 10;
        let server;
        let currentPort = startPort;

        for (let attempt = 0; attempt < maxPortAttempts; attempt++) {
            try {
                server = createServer(app);
                await new Promise((resolve, reject) => {
                    server.listen(currentPort)
                        .once('listening', () => resolve())
                        .once('error', (err) => {
                            if (err.code === 'EADDRINUSE') {
                                console.log(`Port ${currentPort} is busy, trying next port...`);
                                currentPort++;
                                server.close();
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                });

                if (server.listening) {
                    console.log(`⚙️  Server is running at port: ${currentPort}`);
                    break;
                }
            } catch (err) {
                console.error(`Error trying port ${currentPort}:`, err);
                if (attempt === maxPortAttempts - 1) {
                    throw new Error(`Could not find an available port after ${maxPortAttempts} attempts`);
                }
            }
        }

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
