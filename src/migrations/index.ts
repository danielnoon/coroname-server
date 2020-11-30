import { Migration } from "./Migration.model";
import { addSupervote } from "./add-supervote";
import { Update } from "../models/update";
import { addLivestream } from "./add-livestream";
import { addPermissions } from "./add-permissions";

const migrations: Migration[] = [addLivestream, addSupervote, addPermissions];

export async function runMigrations() {
  let lastUpdate = -1;
  const updates = await Update.find({});

  for (let migration of migrations) {
    if (!updates.find((update) => update.version === migration.version)) {
      await migration.applyUpdate();
      const update = new Update({ version: migration.version });
      await update.save();
    }
  }
}
