export interface Token {
  sub: string;
  username: string;
  admin: boolean;
  votesAvailable: number;
  votedFor: number[];
  iat: number;
}