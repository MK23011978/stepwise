export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}
export const fail = (status: number, message: string, code?: string): never => { throw new HttpError(status, message, code); };
export const notFound = (what = 'Not found') => fail(404, what);
export const forbidden = (msg = 'Not allowed') => fail(403, msg);
