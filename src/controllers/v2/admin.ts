import express from "express";
import bcrypt from "bcrypt";
import validate from "../../helpers/validate";
import t from "../../thunk";
import { response } from "../../models/response";
import { AnimeModel } from "../../models/anime";
import { HASH_ROUNDS } from "../../constants";
import { Permission } from "../../Permission";
import { HttpError } from "../../http-error";
import { generateToken } from "../../auth-util";
import { User, trimUsers, trimUser } from "../../models/user";
import getUser from "../../helpers/getUser";
import checkPermissions from "../../helpers/checkPermissions";

const router = express.Router();

router.post(
  "/init",
  t(async (req, res) => {
    validate(req.body, ["username:string!", "password:string!"]);

    const searchResults = await User.find({ admin: true });

    if (searchResults.length > 0) {
      throw new HttpError(
        403,
        "Administrator already exists. Create new administrators using another administrator account."
      );
    }

    const username = req.body.username as string;
    const password = await bcrypt.hash(req.body.password, HASH_ROUNDS);
    const admin = true;

    const user = new User({
      username,
      password,
      admin,
      votesAvailable: 3,
      votedFor: [],
    });

    await user.save();

    res.send(response(0, { token: generateToken(user) }));
  })
);

router.post(
  "/new-user",
  t(async (req, res) => {
    validate(req.body, ["username:string!", "admin:boolean!"]);

    const token = req.header("auth-token");

    const user = await getUser(token);
    checkPermissions(user, Permission.ADD_USERS);

    const username = req.body.username as string;
    const admin = req.body.admin as boolean;

    if (admin) {
      checkPermissions(user, Permission.ADMIN);
    }

    const results = await User.findOne({ username });

    if (results != null) {
      throw new HttpError(409, "User with provided username already exists.");
    }

    try {
      const newUser = new User({
        username,
        admin,
        votesAvailable: 3,
        votedFor: [],
      });

      await newUser.save();

      res.send(response(0, trimUser(newUser)));
    } catch (err) {
      throw new HttpError(500, err.message);
    }
  })
);

router.get(
  "/users",
  t(async (req, res) => {
    const token = req.header("auth-token");

    const user = await getUser(token);

    checkPermissions(user, Permission.EDIT_USERS);

    const users = await User.find({
      username: { $not: { $eq: user.username } },
    });

    res.send(response(0, trimUsers(users)));
  })
);

router.put(
  "/user/:username",
  t(async (req, res) => {
    const token = req.header("auth-token");

    const editor = await getUser(token);
    checkPermissions(editor, Permission.EDIT_USERS);

    const currentUsername = req.params.username;

    const user = await User.findOne({ username: currentUsername });

    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    const newUsername = req.body.username as string;

    if (newUsername != user.username) {
      const existingUser = await User.findOne({ username: newUsername });

      if (existingUser) {
        throw new HttpError(409, "User with provided username already exists.");
      }

      if (newUsername) {
        user.username = newUsername;
      }
    }

    const resetPassword = req.body.resetPassword as boolean;
    if (resetPassword) {
      user.password = "";
    }

    const votes = req.body.votes as number;
    if (typeof votes === "number") {
      user.votesAvailable = votes;
    }

    const admin = req.body.admin as boolean;
    if (typeof admin === "boolean") {
      user.admin = admin;
    }

    await user.save();

    res.send(response(0, "success"));
  })
);

router.delete(
  "/user/:username",
  t(async (req, res) => {
    validate(req.params, ["username:string!"]);

    const token = req.header("auth-token");

    const user = await getUser(token);
    checkPermissions(user, Permission.DELETE_USERS);

    const status = await User.deleteOne({ username: req.params.username });

    if (status.ok) {
      if (typeof status.deletedCount === "number") {
        if (status.deletedCount > 0) {
          res.send(response(0, "success"));
          return;
        }
      }
    }

    throw new HttpError(500, "Unable to delete user.");
  })
);

export default router;
