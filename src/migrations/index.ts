import { Migration } from "./Migration.model";
import { addSupervote } from "./add-supervote";
import { Update } from "../models/meta";

const migrations: Migration[] = [addSupervote];

export async function runMigrations() {
  let lastUpdate = -1;
  while (
    !(await Update.exists({ version: lastUpdate + 1 })) ||
    lastUpdate + 1 <= migrations.length
  ) {
    lastUpdate++;
  }

  for (let i = lastUpdate; i > 0; i--) {
    await migrations[i].applyUpdate();
    const update = new Update({ version: migrations[i].version });
    await update.save();
  }
}
