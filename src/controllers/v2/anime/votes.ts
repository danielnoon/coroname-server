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

router.post(
  "/:id",
  t(async (req, res) => {
    validate(req.params, ["id:number"]);

    const token = req.header("auth-token");

    const user = await getUser(token);
    checkPermissions(user, Permission.VOTE);

    if (user.votesAvailable < 1) {
      throw new HttpError(403, "No votes remaining.");
    }

    const kitsuId = parseInt(req.params.id);

    if (user.votedFor.includes(kitsuId)) {
      throw new HttpError(403, "You've already voted for this anime!");
    }

    let anime = await AnimeModel.findOne({ kitsuId });

    if (!anime) {
      anime = await getKitsuAnime(kitsuId);
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

router.delete(
  "/:id",
  t(async (req, res) => {
    validate(req.params, ["id:number"]);

    const token = req.header("auth-token");

    const user = await getUser(token);
    checkPermissions(user, Permission.VOTE);

    const kitsuId = parseInt(req.params.id);

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
  "/:id",
  t(async (req, res) => {
    const token = req.header("auth-token");

    const user = await getUser(token);
    checkPermissions(user, Permission.VIEW_ANIME);

    validate(req.params, ["id:number"]);

    const id = parseInt(req.params.id);

    const show = await AnimeModel.findOne({ kitsuId: id });

    if (!show) return res.send(response(0, []));

    const voters = await User.find({ votedFor: id });

    res.send(response(0, trimUsers(voters)));
  })
);

router.delete(
  "/",
  t(async (req, res) => {
    const token = req.header("auth-token");

    const user = await getUser(token);
    checkPermissions(user, [Permission.DELETE_VOTES, Permission.EDIT_ANIME]);

    const users = await User.find();

    await Promise.all(
      users.map((user) => {
        user.votesAvailable = 3;
        user.votedFor = [];
        return user.save();
      })
    );

    const animes = await AnimeModel.find({ continuingSeries: false });

    await Promise.all(
      animes.map((anime) => {
        anime.thisWeek = false;
        anime.votes = 0;
        return anime.save();
      })
    );

    res.send(response(0, "success"));
  })
);

export default router;
