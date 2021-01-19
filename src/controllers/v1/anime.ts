import express from "express";
import Kitsu from "kitsu";
import validate from "../../helpers/validate";
import md5 from "md5";
import t from "../../thunk";
import { getUser } from "../../auth-util";
import { HttpError } from "../../http-error";
import { response } from "../../models/response";
import { User, trimUsers } from "../../models/user";
import {
  kitsuToCoroname,
  kitsuArrayToCoroname,
  AnimeModel,
  animeModelAsAnime,
  Anime,
  IAnime,
  animeModelArrayAsAnime,
} from "../../models/anime";

const kitsu = new Kitsu();

const router = express.Router();

router.get(
  "/search",
  t(async (req, res) => {
    const token = req.header("auth-token");
    await getUser(token);

    const query = req.query.q as string;

    const dbResults = animeModelArrayAsAnime(
      await AnimeModel.find({ $text: { $search: query } })
    );

    const { data, errors } = await kitsu.get("anime", {
      params: { filter: { text: query } },
    } as any);

    if (errors) {
      throw new HttpError(errors[0].code, errors[0].title);
    }

    const kitsuResults = await kitsuArrayToCoroname(data);

    const filteredKitsu = kitsuResults.filter(
      (a) => !dbResults.find((b) => a.kitsuId == b.kitsuId)
    );

    res.send(response(0, [...dbResults, ...filteredKitsu]));
  })
);

router.post(
  "/continuing-series",
  t(async (req, res) => {
    validate(req.body, ["id:number!"]);

    const token = req.header("auth-token");
    await getUser(token, true);

    const kitsuId = req.body.id as number;

    let anime = await AnimeModel.findOne({ kitsuId });

    if (!anime) {
      const { data, errors } = await kitsu.get("anime/" + kitsuId);

      if (errors) {
        throw new HttpError(errors[0].code, errors[0].title);
      }

      let nAnime = await kitsuToCoroname(data);

      anime = new AnimeModel(nAnime);
    }

    const currentCS = await AnimeModel.findOne({ continuingSeries: true });

    if (currentCS) {
      currentCS.continuingSeries = false;
      await currentCS.save();
    }

    anime.continuingSeries = true;

    await anime.save();

    res.send(response(0, animeModelAsAnime(anime, true)));
  })
);

router.post(
  "/vote",
  t(async (req, res) => {
    validate(req.body, ["id:number!"]);

    const token = req.header("auth-token");

    const user = await getUser(token);

    if (user.votesAvailable < 1) {
      throw new HttpError(403, "No votes remaining.");
    }

    const kitsuId = req.body.id as number;

    if (user.votedFor.includes(kitsuId)) {
      throw new HttpError(403, "You've already voted for this anime!");
    }

    let anime = await AnimeModel.findOne({ kitsuId });

    if (!anime) {
      const { data, errors } = await kitsu.get("anime/" + kitsuId);

      if (errors) {
        throw new HttpError(errors[0].code, errors[0].title);
      }

      let nAnime = await kitsuToCoroname(data);

      anime = new AnimeModel(nAnime);
    }

    anime.votes++;
    anime.thisWeek = true;

    await anime.save();

    user.votesAvailable--;
    user.votedFor.push(kitsuId);

    await user.save();

    res.send(response(0, "success"));
  })
);

router.post(
  "/rescind",
  t(async (req, res) => {
    validate(req.body, ["id:number!"]);

    const token = req.header("auth-token");

    const user = await getUser(token);

    const kitsuId = req.body.id as number;

    if (!user.votedFor.includes(kitsuId)) {
      throw new HttpError(403, "You have not voted for this anime!");
    }

    let anime = await AnimeModel.findOne({ kitsuId });

    if (!anime) {
      throw new HttpError(418, "What the fuck??");
    }

    anime.votes--;

    await anime.save();

    user.votesAvailable++;
    user.votedFor.splice(user.votedFor.indexOf(kitsuId), 1);

    await user.save();

    res.send(response(0, "success"));
  })
);

router.get(
  "/current",
  t(async (req, res) => {
    const token = req.header("auth-token");

    await getUser(token);

    const all: Anime[] = [];

    const continuingSeries = await AnimeModel.findOne({
      continuingSeries: true,
    });

    if (continuingSeries) {
      all.push(animeModelAsAnime(continuingSeries, true));
    }

    const rest = await AnimeModel.find({
      continuingSeries: false,
      thisWeek: true,
    }).sort({ votes: -1 });

    rest.forEach((anime) => all.push(animeModelAsAnime(anime, true)));

    res.send(response(0, all));
  })
);

router.get(
  "/all",
  t(async (req, res) => {
    const token = req.header("auth-token");

    await getUser(token);

    const anime = (await AnimeModel.find().sort({ votes: -1 })).map((a) =>
      animeModelAsAnime(a, true)
    );

    res.send(response(0, anime));
  })
);

router.get(
  "/:showId/voters",
  t(async (req, res) => {
    const token = req.header("auth-token");

    await getUser(token);

    validate(req.params, ["showId:number"]);

    const id = parseInt(req.params.showId);

    const show = await AnimeModel.findOne({ kitsuId: id });

    if (!show) return res.send(response(0, []));

    const voters = await User.find({ votedFor: id });

    res.send(response(0, trimUsers(voters)));
  })
);

router.delete(
  "/show/:id",
  t(async (req, res) => {
    const token = req.header("auth-token");

    await getUser(token, true);

    validate(req.params, ["id:number"]);

    const id = parseInt(req.params.id);

    const show = (await AnimeModel.findOne({ kitsuId: id })) as Anime;

    if (!show) throw new HttpError(422, "Show does not exist in database.");

    const users = await User.find({ votedFor: id });

    await Promise.all(
      users.map((user) => {
        user.votedFor.splice(user.votedFor.indexOf(id), 1);
        user.votesAvailable += 1;
        user.save();
      })
    );

    show.thisWeek = false;
    show.continuingSeries = false;
    show.votes = 0;

    await (show as IAnime).save();

    return res.send(response(0, {}));
  })
);

router.post(
  "/custom",
  t(async (req, res) => {
    const token = req.header("auth-token");

    await getUser(token, true);

    validate(req.body, [
      "title:string!",
      "poster:string!",
      "synopsis:string!",
      "nsfw:boolean",
      "episodes:number!",
    ]);

    const id = Math.round(
      parseInt(md5(req.body.title + req.body.poster), 16) / 1e30
    );

    if (await AnimeModel.exists({ kitsuId: id })) {
      throw new HttpError(400, "Custom anime already exists.");
    }

    const anime = new AnimeModel({
      kitsuId: id,
      ...req.body,
      supervoted: false,
      continuingSeries: false,
      votes: 0,
      thisWeek: true,
      episode: 0,
    });
    await anime.save();

    return res.send(response(0, {}));
  })
);

export default router;
