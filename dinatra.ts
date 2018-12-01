import { serve } from 'https://deno.land/x/net/http.ts';
import { Response, processResponse } from './response';
import { ErrorCode, getErrorMessage } from './errors';

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

interface Params {
  [key: string]: any;
}

type Context = {
  readonly path: string;
  readonly method: Method;
  params?: Params;
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
        let res: Response;
        try {
          res = ((): Response => {
            if (!req.url) {
              throw ErrorCode.NotFound;
            }
            const [path, search] = req.url.split(/\?(.+)/);

            const map = this.handlerMap[method];
            if (!map) {
              throw ErrorCode.NotFound;
            }

            const handler = map[path];
            if (!handler) {
              throw ErrorCode.NotFound;
            }

            let params: Params = {};
            if (method === Method.GET && search) {
              for (const [key, value] of new URLSearchParams(
                `?${search}`
              ).entries()) {
                params[key] = value;
              }
            }

            const ctx = { method, path, params };
            return handler(ctx);
          })();
        } catch (err) {
          res = ((): Response => {
            let status = ErrorCode.InternalServerError;
            if (typeof err === 'number') {
              status = err;
            }
            return [status, getErrorMessage(status)];
          })();
        }
        await req.respond(processResponse(res));
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
