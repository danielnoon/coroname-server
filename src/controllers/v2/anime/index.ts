import express from "express";
import Kitsu from "kitsu";
import validate from "../../../helpers/validate";
import md5 from "md5";
import t from "../../../thunk";
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

import shows from "./shows";
import votes from "./votes";
import current from "./current";
import getUser from "../../../helpers/getUser";
import checkPermissions from "../../../helpers/checkPermissions";
import { Permission } from "../../../Permission";

const kitsu = new Kitsu();

const router = express.Router();

router.use("/shows", shows);
router.use("/votes", votes);
router.use("/current", current);

router.get(
  "/search",
  t(async (req, res) => {
    const token = req.header("auth-token");

    const user = await getUser(token);
    checkPermissions(user, Permission.VIEW_ANIME);

    const query = req.query.q as string;

    const dbResults = animeModelArrayAsAnime(
      await AnimeModel.find({ $text: { $search: query } })
    );

    const { data, errors } = await kitsu.get("anime", {
      filter: { text: query },
    });

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

router.put(
  "/continuing-series",
  t(async (req, res) => {
    validate(req.body, ["id:number!"]);

    const token = req.header("auth-token");
    const user = await getUser(token);
    checkPermissions(user, Permission.CHANGE_CONTINUING_SERIES);

    const kitsuId = req.body.id as number;

    let anime = await AnimeModel.findOne({ kitsuId });

    if (!anime) {
      anime = await getKitsuAnime(kitsuId);
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

export default router;
