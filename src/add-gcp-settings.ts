import { promises } from "fs";

const { writeFile } = promises;

export async function addGCPSettings() {
  const config = process.env.GCP;
  if (!config) {
    console.error(
      "Could not set Firebase Admin settings.\nPlease add private key to environment variables."
    );
    process.exit(1);
  }
  await writeFile("config.json", config, "utf-8");
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "config.json";
}
