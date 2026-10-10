import type { ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class HttpError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    message: string,
    public readonly code = 'error',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, 'bad_request', details);
/** A 400 that points the client at the offending field. */
export const fieldError = (path: string, message: string) =>
  badRequest(message, [{ path, message }]);
export const unauthorized = (message = 'Authentication required') =>
  new HttpError(401, message, 'unauthorized');
export const forbidden = (message = 'Not allowed') => new HttpError(403, message, 'forbidden');
export const notFound = (message = 'Not found') => new HttpError(404, message, 'not_found');
export const conflict = (message: string) => new HttpError(409, message, 'conflict');

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId') as string | undefined;
  if (err instanceof HttpError) {
    return c.json(
      { error: { code: err.code, message: err.message, details: err.details, requestId } },
      err.status,
    );
  }
  if (err instanceof HTTPException) {
    return c.json(
      { error: { code: 'http_error', message: err.message || 'Request failed', requestId } },
      err.status,
    );
  }
  console.error(`[${requestId ?? '-'}]`, err);
  return c.json({ error: { code: 'internal', message: 'Internal server error', requestId } }, 500);
};

export const notFoundHandler: NotFoundHandler = (c) =>
  c.json(
    { error: { code: 'not_found', message: `No route for ${c.req.method} ${c.req.path}` } },
    404,
  );
