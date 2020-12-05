import { AnimeModel, kitsuToCoroname } from "../models/anime";
import { HttpError } from "../http-error";
import Kitsu from "kitsu";

const kitsu = new Kitsu();

export default async (kitsuId: number) => {
  const { data, errors } = await kitsu.get("anime/" + kitsuId);

  if (errors) {
    throw new HttpError(errors[0].code, errors[0].title);
  }

  let nAnime = await kitsuToCoroname(data);

  return new AnimeModel(nAnime);
};
