import { Router } from "express";
import anime from "./anime";
import admin from "./admin";
import auth from "./auth";
import users from "./users";
import permissions from "./permissions";
import notifications from "./notifications";

const router = Router();

router.use("/anime", anime);
router.use("/admin", admin);
router.use("/auth", auth);
router.use("/users", users);
router.use("/permissions", permissions);
router.use("/beta/notifications", notifications);

export default router;
