import { serve } from 'https://deno.land/x/net/http.ts';
import { Response, processResponse } from './response.ts';
import { ErrorCode, getErrorMessage } from './errors.ts';
import { Method, Params, Handler, HandlerConfig } from './handler.ts';
import { defaultPort } from './constants.ts';
export {
  get,
  post,
  put,
  patch,
  del,
  options,
  link,
  unlink,
} from './handler.ts';

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
          res = await (async (): Promise<Response> => {
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
            } else {
              const body = await req.body();
              // TODO: decode URL formatted string and split by `=`
              // console.log(new TextDecoder('utf-8').decode(body));
            }

            const ctx = { path, method, params };
            const result = handler(ctx);
            if (result instanceof Promise) {
              return await result;
            }
            return result;
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
