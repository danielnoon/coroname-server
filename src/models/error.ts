export interface IError {
  message: string;
}

export function error(message: string): IError {
  return { message }
}
