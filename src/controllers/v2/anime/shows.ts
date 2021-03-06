import express from "express";
import validate from "../../../helpers/validate";
import md5 from "md5";
import t from "../../../thunk";
import getUser from "../../../helpers/getUser";
import { HttpError } from "../../../http-error";
import { response } from "../../../models/response";
import { User } from "../../../models/user";
import {
  AnimeModel,
  animeModelAsAnime,
  Anime,
  IAnime,
} from "../../../models/anime";
import getKitsuAnime from "../../../helpers/getKitsuAnime";
import isDefined from "../../../helpers/isDefined";
import checkPermissions from "../../../helpers/checkPermissions";
import { Permission } from "../../../Permission";

const router = express.Router();

router.post(
  "/",
  t(async (req, res) => {
    const token = req.header("auth-token");
    const user = await getUser(token);
    checkPermissions(user, Permission.ADD_ANIME);

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
      throw new HttpError(400, "Show already exists.");
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

    return res.send(response(0, "success"));
  })
);

router.get(
  "/:id",
  t(async (req, res) => {
    const token = req.header("auth-token");
    const user = await getUser(token);
    checkPermissions(user, Permission.VIEW_ANIME);

    validate(req.params, ["id:number"]);
    validate(req.body, [
      "title:string",
      "poster:string",
      "synposis:string",
      "nsfw:boolean",
      "continuingSeries:boolean",
    ]);

    const id = parseInt(req.params.id);
    let show = await AnimeModel.findOne({ kitsuId: id });

    if (!show) {
      show = await getKitsuAnime(id);
    }

    res.send(response(0, animeModelAsAnime(show, true)));
  })
);

router.patch(
  "/:id",
  t(async (req, res) => {
    const token = req.header("auth-token");
    const user = await getUser(token);

    validate(req.params, ["id:number"]);
    validate(req.body, [
      "title:string",
      "poster:string",
      "synposis:string",
      "nsfw:boolean",
      "continuingSeries:boolean",
      "thisWeek:boolean",
      "episodes:number",
    ]);

    const id = parseInt(req.params.id);
    let show = (await AnimeModel.findOne({ kitsuId: id })) as Anime;

    if (!show) {
      show = await getKitsuAnime(id);
    }

    const {
      title,
      poster,
      synopsis,
      nsfw,
      continuingSeries,
      thisWeek,
      episode,
    } = req.body as Anime;

    if (title) {
      checkPermissions(user, Permission.EDIT_ANIME);
      show.title = title;
    }

    if (poster) {
      checkPermissions(user, Permission.EDIT_ANIME);
      show.poster = poster;
    }

    if (synopsis) {
      checkPermissions(user, Permission.EDIT_ANIME);
      show.synopsis = synopsis;
    }

    if (isDefined(nsfw)) {
      checkPermissions(user, Permission.EDIT_ANIME);
      show.nsfw = nsfw;
    }

    if (isDefined(continuingSeries)) {
      checkPermissions(user, Permission.CHANGE_CONTINUING_SERIES);
      show.continuingSeries = continuingSeries;
    }

    if (isDefined(thisWeek)) {
      checkPermissions(user, Permission.EDIT_ANIME);
      show.thisWeek = thisWeek;
    }

    if (isDefined(episode)) {
      checkPermissions(user, Permission.CHANGE_EPISODE);
      if (episode <= show.episodes && episode >= 0) {
        show.episode = episode;
      } else {
        throw new HttpError(422, "Episode number must be an existing episode.");
      }
    }

    await (show as IAnime).save();

    return res.send(response(0, "success"));
  })
);

router.delete(
  "/:id",
  t(async (req, res) => {
    const token = req.header("auth-token");
    const user = await getUser(token);
    checkPermissions(user, Permission.DELETE_ANIME);

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

    return res.send(response(0, "success"));
  })
);

router.get(
  "/",
  t(async (req, res) => {
    const token = req.header("auth-token");
    const user = await getUser(token);
    checkPermissions(user, Permission.VIEW_ANIME);

    const anime = (await AnimeModel.find().sort({ votes: -1 })).map((a) =>
      animeModelAsAnime(a, true)
    );

    res.send(response(0, anime));
  })
);

export default router;
