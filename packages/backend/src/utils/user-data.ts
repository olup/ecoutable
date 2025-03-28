import { Storage } from "@google-cloud/storage";
import { UserData } from "../models/types.js";

const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKET_NAME || "");

export async function getUserData(userId: string): Promise<UserData> {
  try {
    const file = bucket.file(`${userId}.json`);
    const exists = await file.exists();

    if (!exists[0]) {
      // Return empty user data if file doesn't exist
      return { articles: [] };
    }

    const content = await file.download();
    return JSON.parse(content[0].toString("utf-8"));
  } catch (error) {
    console.error("Error getting user data:", error);
    // Return empty user data on error
    return { articles: [] };
  }
}

export async function saveUserData(
  userId: string,
  data: UserData
): Promise<void> {
  try {
    const file = bucket.file(`${userId}.json`);
    await file.save(JSON.stringify(data, null, 2), {
      contentType: "application/json",
    });
  } catch (error) {
    console.error("Error saving user data:", error);
    throw error;
  }
}
