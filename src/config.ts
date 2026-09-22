export const PATH = '/api/v1';
export const PORT = Number(process.env.PORT) || 3000;
export enum StatusCode {
  SUCCESS = '10000',
  FAILURE = '10001',
  RETRY = '10002',
  INVALID_ACCESS_TOKEN = '10003',
}

export enum ResponseStatus {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_FOUND = 405,
  INTERNAL_ERROR = 500,
}
export const JWT_SECRET_KEY =
  process.env.JWT_SECRET_KEY ?? '';

export const JWT_EXP =
  process.env.JWT_EXP ?? '1h';  

  export const TAX_RATE = 0;

export const SHIPPING_AMOUNT = 0; 