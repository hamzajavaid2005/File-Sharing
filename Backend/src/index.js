import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});

import connectDB from "./DB/index.js";
import app from "./app.js";

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        const port = process.env.PORT || 6000;

        const server = app.listen(port, () => {
            console.log(`⚙️  Server is running at port: ${port}`);
        });

        // Handle server shutdown
        const gracefulShutdown = () => {
            console.log("\nReceived shutdown signal. Closing server...");
            server.close(() => {
                console.log("Server closed.");
                process.exit(0);
            });
        };

        process.on("SIGTERM", gracefulShutdown);
        process.on("SIGINT", gracefulShutdown);
    } catch (error) {
        console.error("ERROR starting server:", error);
        process.exit(1);
    }
};

startServer();
