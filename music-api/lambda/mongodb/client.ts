import mongoose from "mongoose"
import { logger } from "../utils"

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://samuelsymonds2017:Axi5PikP0zYgX7kn@musiccluster1.gfx2ety.mongodb.net/"

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: "music" })

    logger.info("Connected to MongoDB successfully")
  } catch (error) {
    logger.error("Error connecting to MongoDB:", { error })
  }
}
