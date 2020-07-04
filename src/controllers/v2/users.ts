import express from "express";
import bcrypt from "bcrypt";
import validate from "../../helpers/validate";
import t from "../../thunk";
import getUser from "../../helpers/getUser";
import { response } from "../../models/response";
import { User, trimUser } from "../../models/user";
import { HttpError } from "../../http-error";
import { HASH_ROUNDS } from "../../constants";
import checkPermissions from "../../helpers/checkPermissions";
import { Permission } from "../../Permission";

const router = express.Router();

// router.get(
//   "/me",
//   t(async (req, res) => {
//     const token = req.header("auth-token");
//     const user = await getUser(token);

//     res.send(response(0, trimUser(user)));
//   })
// );

// router.put(
//   "/me",
//   t(async (req, res) => {
//     validate(req.body, ["username:string", "email:string", "password:string"]);

//     const token = req.header("auth-token");
//     const user = await getUser(token);

//     if (req.body.username) {
//       user.username = req.body.username;
//     }

//     if (req.body.email) {
//       user.email = req.body.email;
//     }

//     if (req.body.password) {
//       user.password = await bcrypt.hash(req.body.password, HASH_ROUNDS);
//     }

//     await user.save();

//     res.send(response(0, "success"));
//   })
// );

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
      throw new HttpError(404, "User not found.");
    }

    res.send(response(0, trimUser(user)));
  })
);

router.patch(
  "/:user",
  t(async (req, res) => {})
);

router.post(
  "/",
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
