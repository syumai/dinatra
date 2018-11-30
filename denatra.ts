import { serve } from 'https://deno.land/x/net/http.ts';

type StatusBodyResponse = [number, string];

type StatusHeadersBodyResponse = [number, Headers, string];

type Response =
  | StatusHeadersBodyResponse
  | StatusBodyResponse
  | number
  | string;

const getStatusHeadersBodyResponse = (
  res: Response
): StatusHeadersBodyResponse => {
  const r = res as StatusHeadersBodyResponse;
  if (r.length && r.length === 3) {
    return r;
  }
  return null;
};

const getStatusBodyResponse = (res: Response): StatusBodyResponse => {
  const r = res as StatusBodyResponse;
  if (r.length && r.length === 2) {
    return r;
  }
  return null;
};

const getNumberResponse = (res: Response): number => {
  if (typeof res === 'number') {
    return res;
  }
  return null;
};

const getStringResponse = (res: Response): string => {
  if (typeof res === 'string') {
    return res;
  }
  return null;
};

enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  LINK = 'LINK',
  UNLINK = 'UNLINK',
}

type Context = {
  readonly path: string;
  readonly method: Method;
  params?: Object;
};

interface Handler {
  (ctx?: Context): Response;
}

type HandlerMap = {
  [method: string]: {
    [path: string]: Handler;
  };
};

const defaultPort = '8080';

const errNotFound: Response = [404, 'Not Found'];

export async function app(...handlerSets: HandlerSet[]) {
  const a = new App(defaultPort);
  a.handle(...handlerSets);
  return await a.serve();
}

export class App {
  private handlerMap: HandlerMap = {};

  constructor(public readonly port = defaultPort) {
    const handlerMap = {};
    for (const method in Method) {
      handlerMap[method] = {};
    }
    this.handlerMap = handlerMap;
  }

  public handle(...handlerSets: HandlerSet[]) {
    for (const { context, handler } of handlerSets) {
      const { path, method } = context;
      this.handlerMap[method][path] = handler;
    }
  }

  public async serve() {
    const addr = `0.0.0.0:${this.port}`;
    const s = serve(addr);
    console.log(`listening on http://${addr}/`);

    (async () => {
      for await (const req of s) {
        const method = req.method as Method;
        const path = req.url;
        const map = this.handlerMap[method];
        const res = ((): Response => {
          if (!map) {
            return errNotFound;
          }
          const handler = map[path];
          if (!handler) {
            return errNotFound;
          }
          const ctx = { method, path };
          return handler(ctx);
        })();
        let status = 200;
        let headers: Headers;
        let rawBody = '';
        (() => {
          {
            const r = getStatusHeadersBodyResponse(res);
            if (r) {
              [status, headers, rawBody] = r;
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
        await req.respond({ status, body });
      }
    })();
  }
}

type HandlerSet = {
  context: Context;
  handler: Handler;
};

export function get(path: string, handler: Handler): HandlerSet {
  const context = { path: path, method: Method.GET };
  return { context, handler };
}

export function post(path: string, handler: Handler): HandlerSet {
  const context = { path: path, method: Method.POST };
  return { context, handler };
}

export function put(path: string, handler: Handler): HandlerSet {
  const context = { path: path, method: Method.PUT };
  return { context, handler };
}

export function patch(path: string, handler: Handler): HandlerSet {
  const context = { path: path, method: Method.PATCH };
  return { context, handler };
}

export function del(path: string, handler: Handler): HandlerSet {
  const context = { path: path, method: Method.DELETE };
  return { context, handler };
}

export function options(path: string, handler: Handler): HandlerSet {
  const context = { path: path, method: Method.OPTIONS };
  return { context, handler };
}

export function link(path: string, handler: Handler): HandlerSet {
  const context = { path: path, method: Method.LINK };
  return { context, handler };
}

export function unlink(path: string, handler: Handler): HandlerSet {
  const context = { path: path, method: Method.UNLINK };
  return { context, handler };
}
