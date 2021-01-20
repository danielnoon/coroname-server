import { Router } from "express";
import t from "./../../thunk";
import { Permission } from "../../Permission";
import { response } from "../../models/response";
import { getUser } from "../../auth-util";
import checkPermissions from "../../helpers/checkPermissions";
import validate from "../../helpers/validate";
import { addToken, sendMessage } from "../../notifications";
import { HttpError } from "../../http-error";
import { NConsumer } from "../../models/nconsumer";

const router = Router();

router.post(
  "/:channel/subscriptions",
  t(async (req, res) => {
    validate(req.params, ["channel:string!"]);
    validate(req.body, ["token:string!"]);

    const token = req.header("auth-token");
    const user = await getUser(token);

    try {
      addToken(req.body.token, req.params.channel);
    } catch (err) {
      throw new HttpError(500, err);
    }

    const consumer = await NConsumer.findOne({
      token: req.body.token,
    });

    if (!consumer) {
      await new NConsumer({
        token: req.body.token,
        user: user.id,
        subscribed: true,
      }).save();
    } else {
      consumer.subscribed = true;
      consumer.save();
    }

    res.send(response(0, "success"));
  })
);

router.post(
  "/:channel/subscriptions",
  t(async (req, res) => {
    validate(req.params, ["channel:string!"]);
    validate(req.body, ["token:string!"]);

    const token = req.header("auth-token");
    const user = await getUser(token);

    try {
      addToken(req.body.token, req.params.channel);
    } catch (err) {
      throw new HttpError(500, err);
    }

    const consumer = await NConsumer.findOne({
      token: req.body.token,
    });

    if (!consumer) {
      await new NConsumer({
        token: req.body.token,
        user: user.id,
        subscribed: true,
      }).save();
    } else {
      consumer.subscribed = true;
      consumer.save();
    }

    res.send(response(0, "success"));
  })
);

router.post(
  "/:channel/messages",
  t(async (req, res) => {
    validate(req.body, ["title:string!", "body:string!"]);
    validate(req.params, ["channel:string!"]);
    const { title, body } = req.body;

    const token = req.header("auth-token");
    const user = await getUser(token);

    checkPermissions(user, Permission.SEND_NOTIFICATIONS);

    try {
      await sendMessage(title, body, req.params.channel);
    } catch (err) {
      throw new HttpError(500, err);
    }

    res.send(response(0, "success"));
  })
);

export default router;
