import express, { Request, Response } from "express";
import mongoose from "mongoose";
import auth from "./controllers/auth";
import anime from "./controllers/anime";
import admin from "./controllers/admin";
import users from "./controllers/users";
import cors from "cors";
import bp from "body-parser";
import { runMigrations } from "./migrations";

const app = express();

app.use(
  cors({ methods: ["POST", "GET", "OPTIONS", "DELETE", "PUT", "PATCH"] })
);
app.use(bp.json());

mongoose.connect(process.env.DB_URI || "mongodb://localhost:27017/coroname", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/", (req, res) => {
  res.redirect("https://coroname.net");
});

app.use("/auth", auth);
app.use("/anime", anime);
app.use("/admin", admin);
app.use("/users", users);

(async () => {
  await runMigrations();
  app.listen(process.env.PORT || 3000, () => console.log("Listening!"));
})();
