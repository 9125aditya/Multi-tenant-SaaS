import "dotenv/config";
import app from "./app.js";
import prisma from "./lib/prisma.js";
import { env } from "./config/env.js";

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(
    `Server is up and running on port http://localhost:${PORT}`
  );
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    await prisma.$disconnect();

    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));