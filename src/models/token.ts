export interface Token {
  sub: string;
  admin: boolean;
  votesAvailable: number;
  votedFor: number[];
  iat: number;
}