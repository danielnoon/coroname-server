import mongoose, { Document, Schema } from "mongoose";

export class Anime {
  constructor(
    public kitsuId: number,
    public title: string,
    public poster: string,
    public synopsis: string,
    public nsfw: boolean,
    public continuingSeries: boolean,
    public votes: number,
    public supervoted: boolean,
    public thisWeek: boolean,
    public episode: number,
    public episodes: number,
    public native: boolean
  ) {}
}

export async function kitsuArrayToCoroname(kitsu: any[]) {
  const results: Anime[] = [];

  for (const anime of kitsu) {
    results.push(await kitsuToCoroname(anime));
  }

  return results;
}

export async function kitsuToCoroname(anime: any) {
  const id = parseInt(anime.id as string);
  const title = anime.canonicalTitle as string;
  const poster = anime.posterImage?.large as string;
  const synopsis = anime.synopsis as string;
  const nsfw = anime.nsfw as boolean;
  const episodes = anime.episodeCount as number;

  const existing = await AnimeModel.findOne({ kitsuId: id });

  if (existing) {
    return animeModelAsAnime(existing, true);
  } else {
    return new Anime(
      id,
      title,
      poster,
      synopsis,
      nsfw,
      false,
      0,
      false,
      true,
      0,
      episodes,
      false
    );
  }
}

export interface IAnime extends Document, Anime {}

const animeSchema = new Schema<IAnime>({
  kitsuId: { type: Number, unique: true, required: true },
  title: { type: String, required: true },
  poster: String,
  synopsis: String,
  nsfw: Boolean,
  continuingSeries: Boolean,
  votes: Number,
  supervoted: Boolean,
  streamUrl: String,
  episode: Number,
  episodes: Number,
  thisWeek: Boolean,
});

animeSchema.index({ title: "text", synopsis: "text" });

export const AnimeModel = mongoose.model<IAnime>("Anime", animeSchema);

export function animeModelAsAnime(anime: IAnime, native: boolean) {
  return new Anime(
    anime.kitsuId,
    anime.title,
    anime.poster,
    anime.synopsis,
    anime.nsfw,
    anime.continuingSeries,
    anime.votes,
    anime.supervoted,
    anime.thisWeek,
    anime.episode,
    anime.episodes,
    native
  );
}

export function animeModelArrayAsAnime(anime: IAnime[]) {
  return anime.map((a) => animeModelAsAnime(a, true));
}
