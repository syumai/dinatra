type HeaderMap =
  | Headers
  | {
      [key: string]: any;
    };

type StatusHeadersBodyResponse = [number, HeaderMap, string];

type StatusBodyResponse = [number, string];

export type Response =
  | StatusHeadersBodyResponse
  | StatusBodyResponse
  | number // HTTP status code only
  | string; // Response body only

// Response interface of deno.land/x/net/http
interface HTTPResponse {
  status?: number;
  headers?: Headers;
  body?: Uint8Array;
}

export function processResponse(res: Response): HTTPResponse {
  let status = 200;
  let headerMap: HeaderMap = {};
  let rawBody = '';

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
      const r = getStringResponse(res);
      if (r) {
        rawBody = r;
        return;
      }
    }
  })();

  const body = new TextEncoder().encode(rawBody);
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

function getStringResponse(res: Response): string {
  if (typeof res === 'string') {
    return res;
  }
  return null;
}
