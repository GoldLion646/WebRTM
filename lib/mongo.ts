"use server"

import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable.")
}

const dbName = process.env.MONGODB_DB || "rtms"

// Reuse client across hot reloads in dev to avoid connection storms.
let client: MongoClient | null = null
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof global & { _mongoClientPromise?: Promise<MongoClient> }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  client = new MongoClient(uri)
  clientPromise = client.connect()
}

export async function getDb() {
  const connectedClient = await clientPromise
  return connectedClient.db(dbName)
}

