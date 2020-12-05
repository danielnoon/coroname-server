import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import controllers from "./controllers";
import cors from "cors";
import bp from "body-parser";
import { runMigrations } from "./migrations";
import { error } from "./models/error";

const app = express();

app.use(
  cors({ methods: ["POST", "GET", "OPTIONS", "DELETE", "PUT", "PATCH"] })
);
app.use(bp.json());

mongoose.connect(process.env.DB_URI || "mongodb://localhost:27017/coroname", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

app.get("/", (req, res) => {
  res.redirect("https://coroname.net");
});

app.use("/", controllers);

app.use((req, res, next) => {
  res.status(404).send(error("Could not find requested resource."));
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).send(error("Internal server error."));
});

(async () => {
  await runMigrations();
  app.listen(process.env.PORT || 3000, () => console.log("Listening!"));
})();
