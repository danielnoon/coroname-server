import express from 'express';
import { response } from '../models/response';
import Kitsu from 'kitsu';
import { kitsuToCoroname, kitsuArrayToCoroname, AnimeModel, animeModelAsAnime, Anime } from '../models/anime';
import { decodeToken, generateToken } from '../auth-util';
import { error } from '../models/error';
import validate from '../validate';
import { IUser } from '../models/user';

const kitsu = new Kitsu();

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const token = req.header('auth-token');

    if (!token) {
      res.status(401).send(error("Token missing."));
      return;
    }

    const user = await decodeToken(token);

    if (!user) {
      res.status(403).send(error("User does not exist."));
      return;
    }
  } catch {
    res.status(403).send(error("Token could not be verified."));
    return;
  }
  const query = req.query.q as string;

  const { data } = await kitsu.get('anime', {filter: { text: query }});

  const anime = await kitsuArrayToCoroname(data);

  res.send(response(0, anime));
});

router.post('/continuing-series', async (req, res) => {
  if (!validate(req.body, ['id:number!'])) {
    res.status(422).send(error("An anime id is required."));
    return;
  }

  try {
    const token = req.header('auth-token');

    if (!token) {
      res.status(401).send(error("Token missing."));
      return;
    }

    const user = await decodeToken(token);

    if (!user) {
      res.status(401).send(error("User does not exist."));
      return;
    }

    if (!user.admin) {
      res.status(403).send(error("User is not administrator."));
      return;
    }
  } catch {
    res.status(401).send(error("Token could not be verified."));
    return;
  }

  const kitsuId = req.body.id as number;

  let anime = await AnimeModel.findOne({ kitsuId });

  if (!anime) {
    const { data, errors } = await kitsu.get('anime/' + kitsuId);

    if (errors) {
      res.status(errors[0].code).send(error(errors[0].title));
      return;
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

  res.send(response(0, animeModelAsAnime(anime)));
});

router.post('/vote', async (req, res) => {
  if (!validate(req.body, ['id:number!'])) {
    res.status(422).send(error('Anime id missing.'));
    return;
  }
  
  const token = req.header('auth-token');

  if (!token) {
    res.status(401).send(error("Token missing."));
    return;
  }

  let user: IUser;

  try {
    user = await decodeToken(token);

    if (!user) {
      res.status(403).send(error("User does not exist."));
      return;
    }
  } catch {
    res.status(403).send(error("Token could not be verified."));
    return;
  }

  if (user.votesAvailable < 1) {
    res.status(403).send(error("No votes remaining."));
    return;
  }
  
  const kitsuId = req.body.id as number;
  
  if (user.votedFor.includes(kitsuId)) {
    res.status(403).send(error("You've already voted for this anime!"));
    return;
  }

  let anime = await AnimeModel.findOne({ kitsuId });

  if (!anime) {
    const { data, errors } = await kitsu.get('anime/' + kitsuId);

    if (errors) {
      res.status(errors[0].code).send(error(errors[0].title));
      return;
    }

    let nAnime = await kitsuToCoroname(data);

    anime = new AnimeModel(nAnime);
  }

  anime.votes++;

  await anime.save();

  user.votesAvailable--;
  user.votedFor.push(kitsuId);

  await user.save();

  res.send(response(0, 'success'));
});

router.get('/current', async (req, res) => {
  const token = req.header('auth-token');

  if (!token) {
    res.status(401).send(error("Token missing."));
    return;
  }

  let user: IUser;

  try {
    user = await decodeToken(token);

    if (!user) {
      res.status(403).send(error("User does not exist."));
      return;
    }
  } catch {
    res.status(403).send(error("Token could not be verified."));
    return;
  }

  const all: Anime[] = [];

  const continuingSeries = await AnimeModel.findOne({ continuingSeries: true });

  if (continuingSeries) {
    all.push(animeModelAsAnime(continuingSeries));
  }

  const rest = await AnimeModel.find({ continuingSeries: false }).sort({ votes: -1 });

  rest.forEach(anime => all.push(animeModelAsAnime(anime)));

  res.send(response(0, all));
});

export default router;