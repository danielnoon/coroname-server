import express from "express";
import bcrypt from "bcrypt";
import t from "../../thunk";
import getUser from "../../helpers/getUser";
import validate from "../../helpers/validate";
import checkPermissions from "../../helpers/checkPermissions";
import { User, trimUser } from "../../models/user";
import { response } from "../../models/response";
import { HttpError } from "../../http-error";
import { Permission } from "../../Permission";
import { HASH_ROUNDS } from "../../constants";
import { AnimeModel, animeModelArrayAsAnime, IAnime } from "../../models/anime";

const router = express.Router();

router.get(
  "/:username",
  t(async (req, res) => {
    validate(req.params, ["username:string!"]);

    const token = req.header("auth-token");
    const user = await getUser(token);
    const result = await User.findOne({ username: req.params.username });

    if (result) {
      checkPermissions(user, Permission.VIEW_ALL_USERS, result.id);
    } else {
      checkPermissions(user, Permission.VIEW_ALL_USERS);
      throw new HttpError(404, "User not found.");
    }

    res.send(response(0, trimUser(user)));
  })
);

router.get(
  "/:username/votes",
  t(async (req, res) => {
    validate(req.params, ["username:string!"]);

    const token = req.header("auth-token");
    const user = await getUser(token);
    const result = await User.findOne({ username: req.params.username });

    if (result) {
      checkPermissions(user, Permission.VIEW_ALL_USERS, result.id);
    } else {
      checkPermissions(user, Permission.VIEW_ALL_USERS);
      throw new HttpError(404, "User not found.");
    }

    const requests = trimUser(user).votedFor.map((id) =>
      AnimeModel.findOne({ kitsuId: id })
    );
    try {
      const shows = (await Promise.all(requests)) as IAnime[];
      res.send(response(0, animeModelArrayAsAnime(shows)));
    } catch {
      throw new HttpError(500, "Internal Server Error.");
    }
  })
);

router.patch(
  "/:user",
  t(async (req, res) => {
    validate(req.params, ["user:string!"]);
    validate(req.body, [
      "username:string",
      "resetPassword:boolean",
      "votes:number",
      "admin:boolean",
      "password:string",
      "email:string",
    ]);

    const token = req.header("auth-token");
    const editor = await getUser(token);

    const currentUsername = req.params.user;
    const user = await User.findOne({ username: currentUsername });

    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    checkPermissions(editor, Permission.EDIT_USERS, user);

    const newUsername = req.body.username as string;
    if (newUsername != user.username && newUsername) {
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
      checkPermissions(editor, Permission.GRANT_VOTES);
      user.votesAvailable = votes;
    }

    const admin = req.body.admin as boolean;
    if (typeof admin === "boolean") {
      checkPermissions(editor, Permission.ADMIN);
      if (editor.id === user.id) {
        throw new HttpError(403, "You cannot change your own admin status.");
      }
      user.admin = admin;
    }

    const password = req.body.password as string;
    if (password) {
      if (!(editor.id === user.id)) {
        throw new HttpError(
          403,
          "Password can only be changed by the account owner."
        );
      }
      user.password = await bcrypt.hash(password, HASH_ROUNDS);
    }

    const email = req.body.email as string;
    if (email) {
      user.email = email;
    }

    await user.save();

    res.send(response(0, "success"));
  })
);

router.post(
  "/",
  t(async (req, res) => {
    validate(req.body, [
      "username:string!",
      "admin:boolean!",
      "permissions:object!",
    ]);

    const token = req.header("auth-token");
    const user = await getUser(token);
    checkPermissions(user, Permission.ADD_USERS);

    const username = req.body.username as string;
    const admin = req.body.admin as boolean;
    const permissions = req.body.permissions as Permission[];

    if (permissions.every((p) => !["vote", "view anime"].includes(p))) {
      checkPermissions(user, Permission.GRANT_PERMISSIONS);
    }

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
        permissions,
      });

      await newUser.save();

      res.send(response(0, trimUser(newUser)));
    } catch (err) {
      throw new HttpError(500, err.message);
    }
  })
);

router.get(
  "/",
  t(async (req, res) => {
    const token = req.header("auth-token");
    const user = await getUser(token);
    checkPermissions(user, Permission.VIEW_ALL_USERS);

    const results = (await User.find({})).map((result) => trimUser(result));

    res.send(response(0, results));
  })
);

export default router;
