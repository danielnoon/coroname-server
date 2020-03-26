import { IUser, User } from "./models/user";
import jwt from 'jsonwebtoken';
import { Token } from "./models/token";
import { HttpError } from "./http-error";

const TEST_SECRET = 'g4bno9ui2';

export function generateToken(user: IUser) {
  const token: Token = { 
    sub: user.username,
    admin: user.admin,
    votesAvailable: user.votesAvailable,
    votedFor: user.votedFor,
    iat: Date.now()
  };

  return jwt.sign(token, process.env.JWT_SECRET || TEST_SECRET);
}

export async function decodeToken(t: string) {
  try {
    const token = jwt.verify(t, process.env.JWT_SECRET || TEST_SECRET) as Token;
    return await User.findOne({ username: token.sub });
  } catch (err) {
    throw new HttpError(401, "Invalid token.");
  }
}

export async function getUser(t?: string, admin?: boolean) {
  if (!t) {
    throw new HttpError(401, "Token missing.");
  }

  const user = await decodeToken(t);

  if (user == null) {
    throw new HttpError(401, "Invalid token.");
  }

  if (admin) {
    if (!user.admin) {
      throw new HttpError(403, "User is not administrator.");
    }
  }

  return user as IUser;
}
