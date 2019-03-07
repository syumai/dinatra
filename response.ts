import Reader = Deno.Reader;
import { encode } from 'https://deno.land/std/strings/strings.ts';

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

  if (isStatusHeadersBodyResponse(res)) {
    [status, headerMap, rawBody] = res;
  } else if (isStatusBodyResponse(res)) {
    [status, rawBody] = res;
  } else if (isNumberResponse(res)) {
    status = res;
  } else if (isReaderResponse(res)) {
    rawBody = res;
  } else if (isStringResponse(res)) {
    rawBody = res;
  }

  let body: Uint8Array | Reader;
  if (typeof rawBody === 'string') {
    body = encode(rawBody);
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

function isStatusHeadersBodyResponse(
  res: Response
): res is StatusHeadersBodyResponse {
  const r = res as StatusHeadersBodyResponse;
  return r.length && r.length === 3;
}

function isStatusBodyResponse(res: Response): res is StatusBodyResponse {
  const r = res as StatusBodyResponse;
  return r.length && r.length === 2;
}

function isNumberResponse(res: Response): res is number {
  return typeof res === 'number';
}

function isReaderResponse(res: Response): res is Reader {
  const r = res as Reader;
  return typeof r === 'object' && typeof r.read === 'function';
}

function isStringResponse(res: Response): res is string {
  return typeof res === 'string';
}
