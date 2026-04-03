import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_URI_FALLBACK = process.env.MONGODB_URI_FALLBACK;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment variables");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      const primaryUri = MONGODB_URI as string;

      try {
        return await mongoose.connect(primaryUri, {
          dbName: "ai-therapist",
          serverSelectionTimeoutMS: 7000,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        const isSrvIssue =
          message.includes("querySrv") || message.includes("ECONNREFUSED");

        if (isSrvIssue && MONGODB_URI_FALLBACK) {
          console.warn(
            "Primary MongoDB SRV connection failed. Retrying with MONGODB_URI_FALLBACK..."
          );

          return mongoose.connect(MONGODB_URI_FALLBACK, {
            dbName: "ai-therapist",
            serverSelectionTimeoutMS: 7000,
          });
        }

        throw new Error(
          [
            "MongoDB connection failed.",
            `Details: ${message}`,
            "If using mongodb+srv and your DNS/network blocks SRV lookups, add MONGODB_URI_FALLBACK using Atlas's standard (non-SRV) connection string.",
          ].join(" ")
        );
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
    global.mongooseCache = cached;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
