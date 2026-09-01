import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertDriver,
  InsertPayment,
  InsertRating,
  InsertRide,
  InsertRideLocation,
  drivers,
  payments,
  ratings,
  rideLocations,
  rides,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: typeof users.$inferInsert): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: typeof users.$inferInsert = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createRide(input: InsertRide) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(rides).values(input);
  return Number(result[0].insertId);
}

export async function getRideByIdForRider(rideId: number, riderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rides).where(and(eq(rides.id, rideId), eq(rides.riderId, riderId))).limit(1);
  return result[0];
}

export async function getRideByDriverUser(rideId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ ride: rides })
    .from(rides)
    .innerJoin(drivers, eq(rides.driverId, drivers.id))
    .where(and(eq(rides.id, rideId), eq(drivers.userId, userId)))
    .limit(1);
  return result[0]?.ride;
}

export async function updateRideStatus(
  rideId: number,
  status: "driver_assigned" | "driver_arriving" | "in_progress" | "completed" | "cancelled",
  finalFare?: string,
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(rides)
    .set({
      status,
      ...(finalFare ? { finalFare } : {}),
      ...(status === "completed" ? { completedAt: new Date() } : {}),
    })
    .where(eq(rides.id, rideId));
}

export async function getRideHistory(riderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rides).where(eq(rides.riderId, riderId)).orderBy(desc(rides.requestedAt));
}

export async function getAvailableDrivers(category: "standard" | "comfort" | "xl") {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(drivers)
    .where(and(eq(drivers.category, category), eq(drivers.status, "available")))
    .orderBy(desc(drivers.rating));
}

export async function createDriver(input: InsertDriver) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(drivers).values(input);
  return Number(result[0].insertId);
}

export async function saveRideLocation(input: InsertRideLocation) {
  const db = await getDb();
  if (!db) return;
  await db.insert(rideLocations).values(input);
}

export async function createPayment(input: InsertPayment) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(payments).values(input);
  return Number(result[0].insertId);
}

export async function createRating(input: InsertRating) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(ratings).values(input);
  return Number(result[0].insertId);
}
