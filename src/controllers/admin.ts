import express from 'express';
import { error } from '../models/error';
import { decodeToken, generateToken } from '../auth-util';
import { User, IUser, trimUsers, trimUser } from '../models/user';
import { response } from '../models/response';
import { AnimeModel } from '../models/anime';
import bcrypt from 'bcrypt';
import validate from '../validate';
import { HASH_ROUNDS } from '../constants';

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

router.post('/init', async (req, res) => {
  const searchResults = await User.find({ admin: true });

  if (searchResults.length > 0) {
    res.status(403).send(error("Administrator already exists. Create new administrators using another administrator account."));
    return;
  }

  if (!validate(req.body, ["username:string!", "password:string"])) {
    res.status(422).send(error("Missing or invalid parameters."));
    return;
  }

  const username = req.body.username as string;
  const password = await bcrypt.hash(req.body.password, HASH_ROUNDS);
  const admin = true;

  const user = new User({ username, password, admin, votesAvailable: 3, votedFor: [] });

  await user.save();

  res.send(response(0, { token: generateToken(user) }));
});

router.post('/new-user', async (req, res) => {
  if (!validate(req.body, ['username:string!', 'admin:boolean!'])) {
    res.status(422).send(error("Missing or invalid parameters."));
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

  const username = req.body.username as string;
  const admin = req.body.admin as boolean;

  const results = await User.findOne({ username });

  if (results != null) {
    res.status(409).send(error("User with provided username already exists."));
    return;
  }

  try {
    const newUser = new User({
      username,
      admin,
      votesAvailable: 3,
      votedFor: []
    });

    await newUser.save();

    res.send(response(0, trimUser(newUser)));
  } catch (err) {
    res.status(500).send(error(err.message));
  }
});

router.get('/users', async (req, res) => {
  let user: IUser;

  try {
    const token = req.header('auth-token');

    if (!token) {
      res.status(401).send(error("Token missing."));
      return;
    }

    user = await decodeToken(token);

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

  const users = await User.find({ username: { $not: { $eq: user.username } } });

  res.send(response(0, trimUsers(users)));
});

router.put('/user/:username', async (req, res) => {
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

  const currentUsername = req.params.username;

  const user = await User.findOne({ username: currentUsername });

  if (!user) {
    res.status(404).send(error("User not found."));
    return;
  }

  const newUsername = req.body.username as string;

  if (newUsername != user.username) {
    const existingUser = await User.findOne({ username: newUsername });

    if (existingUser) {
      res.status(409).send(error("User with provided username already exists."));
      return;
    }

    if (newUsername) {
      user.username = newUsername;
    }
  }
  
  const resetPassword = req.body.resetPassword as boolean;
  if (resetPassword) {
    user.password = "";
  }

  const admin = req.body.admin as boolean;
  user.admin = admin;

  await user.save();

  res.send(response(0, 'success'));
});

router.delete('/user/:username', async (req, res) => {
  if (!req.params.username) {
    res.status(422).send(error("Missing username parameter."));
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

  const status = await User.deleteOne({ username: req.params.username });

  if (status.ok) {
    if (typeof status.deletedCount === 'number') {
      if (status.deletedCount > 0) {
        res.send(response(0, 'success'));
        return;
      }
    }
  }

  res.status(500).send(error('guh'));
})

export default router;
