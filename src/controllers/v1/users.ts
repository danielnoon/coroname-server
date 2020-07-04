import express from "express";
import bcrypt from "bcrypt";
import validate from "../../helpers/validate";
import t from "../../thunk";
import { getUser } from "../../auth-util";
import { response } from "../../models/response";
import { User, trimUser } from "../../models/user";
import { HttpError } from "../../http-error";
import { HASH_ROUNDS } from "../../constants";

const router = express.Router();

router.get(
  "/user/:username",
  t(async (req, res) => {
    validate(req.params, ["username:string!"]);

    const token = req.header("auth-token");
    await getUser(token);

    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    res.send(response(0, trimUser(user)));
  })
);

router.get(
  "/me",
  t(async (req, res) => {
    const token = req.header("auth-token");
    const user = await getUser(token);

    res.send(response(0, trimUser(user)));
  })
);

router.put(
  "/me",
  t(async (req, res) => {
    validate(req.body, ["username:string", "email:string", "password:string"]);

    const token = req.header("auth-token");
    const user = await getUser(token);

    if (req.body.username) {
      user.username = req.body.username;
    }

    if (req.body.email) {
      user.email = req.body.email;
    }

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, HASH_ROUNDS);
    }

    await user.save();

    res.send(response(0, "success"));
  })
);

export default router;
