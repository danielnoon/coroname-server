import { Migration } from "./Migration.model";
import { User } from "../models/user";
import { AnimeModel } from "../models/anime";

export const addSupervote = new Migration(0, async () => {
  const users = await User.find({});
  for (let user of users) {
    user.supervoteAvailable = true;
    await user.save();
  }

  const anime = await AnimeModel.find({});
  for (let show of anime) {
    show.supervoted = false;
    await show.save();
  }
});
