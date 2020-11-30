import { Router } from "express";
import t from "./../../thunk";
import { Permission } from "../../Permission";
import { response } from "../../models/response";
import { getUser } from "../../auth-util";
import checkPermissions from "../../helpers/checkPermissions";

const router = Router();

router.get(
  "/",
  t(async (req, res) => {
    const token = req.header("auth-token");
    const user = await getUser(token);

    checkPermissions(user, Permission.EDIT_ANIME);

    if (user.admin) {
      res.send(response(0, Object.values(Permission)));
    } else {
      res.send(
        response(
          0,
          Object.values(Permission).filter((p) => user.permissions.includes(p))
        )
      );
    }
  })
);

export default router;
