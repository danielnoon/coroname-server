import { IUser, User } from "./models/user";
import jwt from 'jsonwebtoken';
import { Token } from "./models/token";

const TEST_SECRET = 'g4bno9ui2';

export function generateToken(user: IUser) {
  const token: Token = { 
    sub: user.username,
    admin: user.admin,
    iat: Date.now()
  };

  return jwt.sign(token, process.env.JWT_SECRET || TEST_SECRET);
}

export function decodeToken(t: string): Promise<IUser> {
  const token = jwt.verify(t, TEST_SECRET) as Token;
  return User.findOne({ username: token.sub }).then();
}
