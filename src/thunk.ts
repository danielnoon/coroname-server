import { Request, Response, NextFunction } from "express";
import { error } from "./models/error";

const wrap = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) =>
  fn(req, res, next).catch((err) => {
    res
      .status(err.code || 500)
      .send(error(err.message) || "Internal server error.");
    next();
  });

export default wrap;
