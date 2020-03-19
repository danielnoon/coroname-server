import express from 'express';
import { User, IUser } from '../models/user';
import { error } from '../models/error';
import { response } from '../models/response';
import bcrypt from 'bcrypt';
import { generateToken, decodeToken } from '../auth-util';
import validate from '../validate';

const router = express.Router();

router.post('/login', async (req, res) => {
  const u = req.body as IUser;
  
  const user = await User.findOne({ username: u.username });

  if (user === null) {
    res.status(422).send(error("User does not exist."));
    return;
  }

  if (!user.password) {
    res.send(response(1, {}));
    return;
  }

  if (await bcrypt.compare(u.password, user.password)) {
    res.send(response(0, generateToken(user)));
  }
});

router.post('/new-account', async (req, res) => {
  const t = req.header('auth-token');

  if (!t) {
    res.status(401).send(error("You are not logged in! How did you get here??"));
    return;
  }

  const user = await decodeToken(t);

  if (!user.admin) {
    res.status(401).send(error("You must be an administrator to perform this action."));
    return;
  }

  const username = req.body.username as string;
  const admin = req.body.admin as boolean;

  const newUser = new User({
    username,
    admin
  });

  await newUser.save();

  res.send(response(0, {}));
});

router.post('/init', async (req, res) => {
  const searchResults = await User.find();

  if (searchResults.length > 0) {
    res.status(403).send(error("Administrator already exists. Create new administrators using that account."));
    return;
  }

  if (!validate(req.body, ["username:string!", "password:string"])) {
    res.status(422).send(error("Missing or invalid parameters."));
    return;
  }

  const username = req.body.username as string;
  const password = await bcrypt.hash(req.body.password, 10);
  const admin = true;

  const user = new User({ username, password, admin });

  await user.save();

  res.send(response(0, { token: generateToken(user) }));
});

export default router;
