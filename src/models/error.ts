export interface IError {
  code: -1;
  message: string;
}

export function error(message: string): IError {
  return { code: -1, message }
}
