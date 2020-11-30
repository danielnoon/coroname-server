import { Migration } from "./Migration.model";
import { User } from "../models/user";
import { Permission } from "../Permission";

export const addPermissions = new Migration(2, async () => {
  console.log("Add Permissions");

  const users = await User.find({});

  await Promise.all(
    users.map(async (user) => {
      user.permissions = [];

      user.permissions.push(Permission.VIEW_ANIME);
      user.permissions.push(Permission.VOTE);
      if (user.admin) user.permissions.push(Permission.ADMIN);

      await user.save();
    })
  );
});
