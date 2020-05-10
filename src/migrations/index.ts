import { Migration } from "./Migration.model";
import { addSupervote } from "./add-supervote";
import { Update } from "../models/update";
import { addLivestream } from "./add-livestream";

const migrations: Migration[] = [addLivestream, addSupervote];

export async function runMigrations() {
  let lastUpdate = -1;
  const updates = await Update.find({});

  while (
    !updates.find(
      (update) => update.version === migrations[lastUpdate + 1].version
    ) &&
    lastUpdate + 1 < migrations.length
  ) {
    lastUpdate++;
  }

  for (let i = lastUpdate; i >= 0; i--) {
    await migrations[i].applyUpdate();
    const update = new Update({ version: migrations[i].version });
    await update.save();
  }
}
