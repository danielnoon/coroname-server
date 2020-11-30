import mongoose, { Document, Schema } from "mongoose";

export class Anime {
  public kitsuId: number;
  public title: string;
  public poster: string;
  public synopsis: string;
  public nsfw: boolean;
  public continuingSeries: boolean;
  public votes: number;
  public supervoted: boolean;
  public thisWeek: boolean;
  public episode: number;
  public episodes: number;
  public native: boolean;

  constructor(anime: Anime) {
    this.kitsuId = anime.kitsuId;
    this.title = anime.title;
    this.poster = anime.poster;
    this.synopsis = anime.synopsis;
    this.nsfw = anime.nsfw;
    this.continuingSeries = anime.continuingSeries;
    this.votes = anime.votes;
    this.supervoted = anime.supervoted;
    this.thisWeek = anime.thisWeek;
    this.episode = anime.episode;
    this.episodes = anime.episodes;
    this.native = anime.native;
  }
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
    return new Anime({
      kitsuId: id,
      title,
      poster,
      synopsis,
      nsfw,
      continuingSeries: false,
      episode: 0,
      episodes,
      native: false,
      supervoted: false,
      thisWeek: false,
      votes: 0,
    });
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
  return new Anime({ ...anime.toObject(), native });
}

export function animeModelArrayAsAnime(anime: IAnime[]) {
  return anime.map((a) => animeModelAsAnime(a, true));
}
