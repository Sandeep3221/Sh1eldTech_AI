import { connectToDatabase } from "../app/lib/db";
import { Client } from "../app/model/client.model";
import mongoose from "mongoose";

async function main() {
  try {
    await connectToDatabase();
    
    const filter = {
      status: { $exists: false }
    };
    
    const matchCount = await Client.countDocuments(filter);
    
    if (matchCount === 0) {
      console.log("No legacy clients require status backfill.");
      await mongoose.disconnect();
      process.exit(0);
    }
    
    const result = await Client.updateMany(
      filter,
      { $set: { status: 'active' } }
    );
    
    console.log("Client status backfill complete.");
    console.log(`Matched legacy clients: ${matchCount}`);
    console.log(`Updated clients: ${result.modifiedCount}`);
    console.log("Default status: active");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
