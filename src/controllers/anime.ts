import express from 'express';
import { response } from '../models/response';
import Kitsu from 'kitsu';
import { kitsuToCoroname } from '../models/anime';
import { decodeToken } from '../auth-util';
import { error } from '../models/error';

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

  const anime = kitsuToCoroname(data);

  res.send(response(0, anime));
});

export default router;