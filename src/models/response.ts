export interface IResponse {
  code: number;
  data: any;
}

export function response(code: number, data: any): IResponse {
  return { code, data };
}
