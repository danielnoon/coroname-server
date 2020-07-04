import { HttpError } from "../http-error";
import { decodeToken } from "../auth-util";

export default async (token?: string) => {
  if (!token) {
    throw new HttpError(401, "Token missing.");
  }

  const user = await decodeToken(token);

  if (user == null) {
    throw new HttpError(401, "Invalid token.");
  }

  return user;
};
