import express from 'express';
import { User, IUser } from '../models/user';
import { error } from '../models/error';
import { response } from '../models/response';
import bcrypt from 'bcrypt';
import { generateToken, decodeToken, getUser } from '../auth-util';
import validate from '../validate';
import { HASH_ROUNDS } from '../constants';
import t from './../thunk';
import { HttpError } from '../http-error';

const router = express.Router();

router.post('/login', t(async (req, res) => {
  validate(req.body, ["username:string!", "password:string!"]);

  const u = req.body as IUser;
  
  const user = await User.findOne({ username: u.username });

  if (user === null) {
    throw new HttpError(422, "Incorrect username.");
  }

  if (!user.password) {
    user.password = await bcrypt.hash(u.password, HASH_ROUNDS);

    await user.save();

    res.send(response(0, { token: generateToken(user) }));
    return;
  }

  if (await bcrypt.compare(u.password, user.password)) {
    res.send(response(0, { token: generateToken(user) }));
  } else {
    throw new HttpError(400, "Incorrect password.");
  }
}));

router.get('/new-token', t(async (req, res) => {
  const token = req.header('auth-token');

  const user = await getUser(token);

  res.send(response(0, { token: generateToken(user) }));
}));

export default router;
