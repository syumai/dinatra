import { serve } from 'https://deno.land/x/net/http.ts';
import { Response, processResponse } from './response.ts';
import { ErrorCode, getErrorMessage } from './errors.ts';
import { Method, Params, Context, Handler, HandlerConfig } from './handler.ts';
export { get, post, put, patch, del, options, link, unlink } from './handler.ts';

const defaultPort = '8080';

type HandlerMap = Map<string, Map<string, Handler>>; // Map<method, Map<path, handler>>

export async function app(...handlerConfigs: HandlerConfig[]) {
  const a = new App(defaultPort);
  a.handle(...handlerConfigs);
  return await a.serve();
}

export class App {
  private handlerMap: HandlerMap = new Map();

  constructor(public readonly port = defaultPort) {
    for (const method in Method) {
      this.handlerMap.set(method, new Map());
    }
  }

  public handle(...handlerConfigs: HandlerConfig[]) {
    for (const { path, method, handler } of handlerConfigs) {
      this.handlerMap.get(method).set(path, handler);
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

            const map = this.handlerMap.get(method);
            if (!map) {
              throw ErrorCode.NotFound;
            }

            const handler = map.get(path);
            if (!handler) {
              throw ErrorCode.NotFound;
            }

            const params: Params = {};
            if (method === Method.GET && search) {
              for (const [key, value] of new URLSearchParams(
                `?${search}`
              ).entries()) {
                params[key] = value;
              }
            }

            const ctx = { path, method, params };
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
