import express from 'express';
import { User, IUser } from '../models/user';
import { error } from '../models/error';
import { response } from '../models/response';
import bcrypt from 'bcrypt';
import { generateToken, decodeToken } from '../auth-util';
import validate from '../validate';
import { HASH_ROUNDS } from '../constants';

const router = express.Router();

router.post('/login', async (req, res) => {
  if (!validate(req.body, ["username:string!", "password:string!"])) {
    res.status(422).send(error("Missing or invalid parameters."));
    return;
  }

  const u = req.body as IUser;
  
  const user = await User.findOne({ username: u.username });

  if (user === null) {
    res.status(422).send(error("User does not exist."));
    return;
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
    res.status(400).send(error("Password is incorrect."));
  }
});

router.get('/new-token', async (req, res) => {
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

  res.send(response(0, { token: generateToken(user) }));
});

export default router;
