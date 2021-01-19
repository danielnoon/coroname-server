import { promises } from "fs";

const { writeFile } = promises;

export async function addGCPSettings() {
  const config = process.env.GCP;
  await writeFile("config.json", config, "utf-8");
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "config.json";
}
