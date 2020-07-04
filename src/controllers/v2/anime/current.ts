import express from "express";
import Kitsu from "kitsu";
import validate from "../../../helpers/validate";
import md5 from "md5";
import t from "../../../thunk";
import getUser from "../../../helpers/getUser";
import { HttpError } from "../../../http-error";
import { response } from "../../../models/response";
import { User, trimUsers } from "../../../models/user";
import {
  kitsuToCoroname,
  kitsuArrayToCoroname,
  AnimeModel,
  animeModelAsAnime,
  Anime,
  IAnime,
  animeModelArrayAsAnime,
} from "../../../models/anime";
import getKitsuAnime from "../../../helpers/getKitsuAnime";
import isDefined from "../../../helpers/isDefined";
import checkPermissions from "../../../helpers/checkPermissions";
import { Permission } from "../../../Permission";

const router = express.Router();

router.get(
  "/",
  t(async (req, res) => {
    const token = req.header("auth-token");

    const user = await getUser(token);
    checkPermissions(user, Permission.VIEW_ANIME);

    const all: Anime[] = [];

    const continuingSeries = await AnimeModel.findOne({
      continuingSeries: true,
    });

    if (continuingSeries) {
      all.push(animeModelAsAnime(continuingSeries));
    }

    const rest = await AnimeModel.find({
      continuingSeries: false,
      thisWeek: true,
    }).sort({ votes: -1 });

    rest.forEach((anime) => all.push(animeModelAsAnime(anime)));

    res.send(response(0, all));
  })
);

router.get(
  "/:id",
  t(async (req, res) => {
    const token = req.header("auth-token");

    const user = await getUser(token);
    checkPermissions(user, Permission.VIEW_ANIME);

    validate(req.params, ["id:number"]);

    const id = parseInt(req.params.id);

    const show = (await AnimeModel.findOne({ kitsuId: id })) as Anime;

    if (!show) throw new HttpError(404, "Show does not exist in database.");

    if (!show.thisWeek) throw new HttpError(404, "Not a current show.");
  })
);

router.delete(
  "/:id",
  t(async (req, res) => {
    const token = req.header("auth-token");

    const user = await getUser(token);
    checkPermissions(user, Permission.EDIT_ANIME);

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

export default router;
