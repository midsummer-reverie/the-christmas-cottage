import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as appSchema from "./schema";
import * as authSchema from "./auth-schema";

const schema = { ...appSchema, ...authSchema };
const createDatabase = (connectionString: string) => drizzle(neon(connectionString), { schema });
let database: ReturnType<typeof createDatabase> | undefined;

export function requireDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured. Copy .env.example to .env.local and add your Neon connection string.");
  if (!database) database = createDatabase(connectionString);
  return database;
}
