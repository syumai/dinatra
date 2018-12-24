import { Reader } from 'deno';

// HeaderMap is a type of response headers.
type HeaderMap =
  | Headers
  | {
      [key: string]: any;
    };

// ResponseBody is a type of response body.
type ResponseBody = string | Reader;

/*
 *  Types of Response
 */

// StatusHeadersBodyResponse is a response with status code, headers, body.
type StatusHeadersBodyResponse = [number, HeaderMap, ResponseBody];

// StatusBodyResponse is a response with status code, body.
type StatusBodyResponse = [number, ResponseBody];

// Response is a type of response.
export type Response =
  | StatusHeadersBodyResponse
  | StatusBodyResponse
  | number // HTTP status code only
  | ResponseBody; // Response body only

// Response interface of deno.land/x/net/http
interface HTTPResponse {
  status?: number;
  headers?: Headers;
  body?: Uint8Array | Reader;
}

export function processResponse(res: Response): HTTPResponse {
  let status = 200;
  let headerMap: HeaderMap = {};
  let rawBody: ResponseBody = '';

  (() => {
    {
      const r = getStatusHeadersBodyResponse(res);
      if (r) {
        [status, headerMap, rawBody] = r;
        return;
      }
    }
    {
      const r = getStatusBodyResponse(res);
      if (r) {
        [status, rawBody] = r;
        return;
      }
    }
    {
      const r = getNumberResponse(res);
      if (r) {
        status = r;
        return;
      }
    }
    {
      const r = getReaderResponse(res);
      if (r) {
        rawBody = r;
        return;
      }
    }
    {
      const r = getStringResponse(res);
      if (r) {
        rawBody = r;
        return;
      }
    }
  })();

  let body: Uint8Array | Reader;
  if (typeof rawBody === 'string') {
    body = new TextEncoder().encode(rawBody);
  } else {
    body = rawBody;
  }
  const headers = new Headers(headerMap);
  return {
    status,
    body,
    headers,
  };
}

function getStatusHeadersBodyResponse(
  res: Response
): StatusHeadersBodyResponse {
  const r = res as StatusHeadersBodyResponse;
  if (r.length && r.length === 3) {
    return r;
  }
  return null;
}

function getStatusBodyResponse(res: Response): StatusBodyResponse {
  const r = res as StatusBodyResponse;
  if (r.length && r.length === 2) {
    return r;
  }
  return null;
}

function getNumberResponse(res: Response): number {
  if (typeof res === 'number') {
    return res;
  }
  return null;
}

function getReaderResponse(res: Response): Reader {
  const r = res as Reader;
  if (typeof r === 'object' && typeof r.read === 'function') {
    return r;
  }
  return null;
}

function getStringResponse(res: Response): string {
  if (typeof res === 'string') {
    return res;
  }
  return null;
}
