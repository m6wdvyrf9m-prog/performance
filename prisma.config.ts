import dotenv from "dotenv";
import { defineConfig } from "prisma/config";
import { getDatabaseUrl } from "./src/lib/database-url";

dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatabaseUrl(),
  },
});
