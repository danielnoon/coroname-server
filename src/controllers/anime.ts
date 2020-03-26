import express from 'express';
import { response } from '../models/response';
import Kitsu from 'kitsu';
import { kitsuToCoroname, kitsuArrayToCoroname, AnimeModel, animeModelAsAnime, Anime } from '../models/anime';
import { getUser } from '../auth-util';
import validate from '../validate';
import { User, trimUsers } from '../models/user';
import { HttpError } from '../http-error';
import t from '../thunk';

const kitsu = new Kitsu();

const router = express.Router();

router.get('/search', t(async (req, res) => {
  const token = req.header('auth-token');
  await getUser(token);

  const query = req.query.q as string;

  const { data, errors } = await kitsu.get('anime', {filter: { text: query }});

  if (errors) {
    throw new HttpError(errors[0].code, errors[0].title);
  }

  const anime = await kitsuArrayToCoroname(data);

  res.send(response(0, anime));
}));

router.post('/continuing-series', t(async (req, res) => {
  validate(req.body, ['id:number!']);

  const token = req.header('auth-token');
  await getUser(token, true);

  const kitsuId = req.body.id as number;

  let anime = await AnimeModel.findOne({ kitsuId });

  if (!anime) {
    const { data, errors } = await kitsu.get('anime/' + kitsuId);

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

  res.send(response(0, animeModelAsAnime(anime)));
}));

router.post('/vote', t(async (req, res) => {
  validate(req.body, ['id:number!']);
  
  const token = req.header('auth-token');

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
    const { data, errors } = await kitsu.get('anime/' + kitsuId);

    if (errors) {
      throw new HttpError(errors[0].code, errors[0].title);
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
}));

router.post('/rescind', t(async (req, res) => {
  validate(req.body, ['id:number!']);
  
  const token = req.header('auth-token');

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
  user.votedFor.splice(user.votedFor.indexOf(kitsuId));

  await user.save();

  res.send(response(0, 'success'));
}));

router.get('/current', t(async (req, res) => {
  const token = req.header('auth-token');

  await getUser(token);

  const all: Anime[] = [];

  const continuingSeries = await AnimeModel.findOne({ continuingSeries: true });

  if (continuingSeries) {
    all.push(animeModelAsAnime(continuingSeries));
  }

  const rest = await AnimeModel.find({ continuingSeries: false }).sort({ votes: -1 });

  rest.forEach(anime => all.push(animeModelAsAnime(anime)));

  res.send(response(0, all));
}));

router.get('/:showId/voters', t(async (req, res) => {
  const token = req.header('auth-token');

  await getUser(token);

  validate(req.params, ['showId:number']);

  const id = parseInt(req.params.showId);

  const show = AnimeModel.findOne({ kitsuId: id });

  if (!show) throw new HttpError(404, "Show does not exist or has not been voted on.");

  const voters = await User.find({ votedFor: id });

  res.send(response(0, trimUsers(voters)));
}));

export default router;