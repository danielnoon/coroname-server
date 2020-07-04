import { Router } from "express";
import anime from "./anime";
import admin from "./admin";
import auth from "./auth";
import users from "./users";

const router = Router();

router.use("/anime", anime);
router.use("/admin", admin);
router.use("/auth", auth);
router.use("/users", users);

export default router;
