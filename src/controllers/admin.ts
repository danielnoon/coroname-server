import express from 'express';
import { error } from '../models/error';
import { decodeToken } from '../auth-util';
import { User } from '../models/user';
import { response } from '../models/response';
import { AnimeModel } from '../models/anime';

const router = express.Router();

router.post('/reset-votes', async (req, res) => {
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

  const users = await User.find();

  await Promise.all(users.map(user => {
    user.votesAvailable = 3;
    user.votedFor = [];
    return user.save();
  }))

  await AnimeModel.deleteMany({ continuingSeries: false });

  res.send(response(0, 'success'));
})

export default router;
