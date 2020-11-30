import express from "express";
import bcrypt from "bcrypt";
import validate from "../../helpers/validate";
import t from "../../thunk";
import { response } from "../../models/response";
import { HASH_ROUNDS } from "../../constants";
import { Permission } from "../../Permission";
import { HttpError } from "../../http-error";
import { generateToken } from "../../auth-util";
import { User, trimUsers } from "../../models/user";
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

export default router;
