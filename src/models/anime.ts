import { Document } from "mongoose";

export class Anime {
  constructor(
    public kitsuId: number,
    public title: string,
    public poster: string,
    public synopsis: string,
    public nsfw: boolean,
    // public votes 
  ) {}
}

export function kitsuToCoroname(kitsu: any[]) {
  const results: Anime[] = [];

  for (const anime of kitsu) {
    const id = anime.id as number;
    const title = anime.canonicalTitle as string;
    const poster = anime.posterImage.large as string;
    const synopsis = anime.synopsis as string;
    const nsfw = anime.nsfw as boolean;

    results.push(new Anime(id, title, poster, synopsis, nsfw));
  }

  return results;
}
