import express from "express";
import bcrypt from "bcrypt";
import validate from "../../helpers/validate";
import t from "../../thunk";
import { HttpError } from "../../http-error";
import { HASH_ROUNDS } from "../../constants";
import { User, IUser } from "../../models/user";
import { response } from "../../models/response";
import { generateToken, getUser } from "../../auth-util";

const router = express.Router();

router.post(
  "/login",
  t(async (req, res) => {
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
  })
);

router.get(
  "/new-token",
  t(async (req, res) => {
    const token = req.header("auth-token");

    const user = await getUser(token);

    res.send(response(0, { token: generateToken(user) }));
  })
);

export default router;
