import { encode } from "./vendor/https/deno.land/std/strings/mod.ts";

// HeaderMap is a type of response headers.
type HeaderMap =
  | Headers
  | {
    [key: string]: any;
  };

// ResponseBody is a type of response body.
type ResponseBody = string | Deno.ReadCloser | Deno.Reader;

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

// Response interface
interface HTTPResponse {
  status?: number;
  headers?: Headers;
  body?: Uint8Array | Deno.ReadCloser | Deno.Reader;
}

export function processResponse(res: Response): HTTPResponse {
  let status = 200;
  let headerMap: HeaderMap = {};
  let rawBody: ResponseBody = "";

  if (isStatusHeadersBodyResponse(res)) {
    [status, headerMap, rawBody] = res;
  } else if (isStatusBodyResponse(res)) {
    [status, rawBody] = res;
  } else if (isNumberResponse(res)) {
    status = res;
  } else if (isReadCloserResponse(res)) {
    rawBody = res;
  } else if (isReaderResponse(res)) {
    rawBody = res;
  } else if (isStringResponse(res)) {
    rawBody = res;
  }

  let body: Uint8Array | Deno.ReadCloser | Deno.Reader;
  if (typeof rawBody === "string") {
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
  res: Response,
): res is StatusHeadersBodyResponse {
  const r = res as StatusHeadersBodyResponse;
  return Array.isArray(r) && r.length === 3;
}

function isStatusBodyResponse(res: Response): res is StatusBodyResponse {
  const r = res as StatusBodyResponse;
  return Array.isArray(r) && r.length === 2;
}

function isNumberResponse(res: Response): res is number {
  return typeof res === "number";
}

function isReadCloserResponse(res: Response): res is Deno.ReadCloser {
  const r = res as Deno.ReadCloser;
  return (
    typeof r === "object" &&
    typeof r.read === "function" &&
    typeof r.close === "function"
  );
}

function isReaderResponse(res: Response): res is Deno.Reader {
  const r = res as Deno.Reader;
  return typeof r === "object" && typeof r.read === "function";
}

function isStringResponse(res: Response): res is string {
  return typeof res === "string";
}
