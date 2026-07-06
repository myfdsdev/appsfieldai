const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "appsfieldai";
const collectionName = process.env.MONGODB_COLLECTION || "domain_mappings";

const client = new MongoClient(uri || "mongodb://localhost:27017");
let collection = null;

// Connect once at startup and create the indexes that back the two hot lookups:
// Host-header → mapping (unique on domain) and store slug → mapping.
async function connect() {
  if (!uri) throw new Error("MONGODB_URI is not set");
  await client.connect();
  collection = client.db(dbName).collection(collectionName);
  await collection.createIndex({ domain: 1 }, { unique: true });
  await collection.createIndex({ store_slug: 1 });
  return collection;
}

// The domain_mappings collection. Throws if called before connect() resolves.
function domains() {
  if (!collection) throw new Error("MongoDB not connected yet");
  return collection;
}

module.exports = { connect, domains, client };
