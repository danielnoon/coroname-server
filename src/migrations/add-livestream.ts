import { Migration } from "./Migration.model";
import { AnimeModel, Anime, kitsuToCoroname } from "../models/anime";
import Kitsu from "kitsu";

export const addLivestream = new Migration(1, async () => {
  console.log("Add Livestream");

  const kitsu = new Kitsu();

  const animes = await AnimeModel.find({});

  await Promise.all(
    animes.map((anime) => {
      return new Promise(async (resolve, reject) => {
        anime.thisWeek = true;
        anime.episode = 0;

        const { data } = await kitsu.get("anime/" + anime.kitsuId);

        const k = await kitsuToCoroname(data);
        anime.episodes = k.episodes;

        await anime.save();
        resolve();
      });
    })
  );
});
