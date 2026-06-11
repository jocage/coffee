import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL ?? "postgres://coffee:coffee@localhost:5432/coffee_journey";
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
export type Db = typeof db;
