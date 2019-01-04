import { serve, ServerRequest } from 'https://deno.land/x/net/http.ts';
import { stat, FileInfo, open } from 'deno';
import { Response, processResponse } from './response.ts';
import { ErrorCode, getErrorMessage } from './errors.ts';
import { Method, Params, Handler, HandlerConfig } from './handler.ts';
import { defaultPort } from './constants.ts';
import { detectedContentType } from './mime.ts';
export { contentType, detectedContentType } from './mime.ts';
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

  constructor(
    public readonly port = defaultPort,
    public readonly publicDir = 'public'
  ) {
    for (const method in Method) {
      this.handlerMap.set(method, new Map());
    }
  }

  private async respondStatic(path: string): Promise<Response> {
    let fileInfo: FileInfo;
    let staticFilePath = `${this.publicDir}${path}`;
    try {
      fileInfo = await stat(staticFilePath);
    } catch (e) {
      // Do nothing here.
    }
    if (fileInfo && fileInfo.isDirectory()) {
      staticFilePath += '/index.html';
      try {
        fileInfo = await stat(staticFilePath);
      } catch (e) {
        // Do nothing here.
      }
    }
    if (fileInfo && fileInfo.isFile()) {
      return [
        200,
        // Add content length
        detectedContentType(staticFilePath),
        await open(staticFilePath),
      ];
    }
    return null;
  }

  private async respond(
    path,
    search: string,
    method: Method,
    req: ServerRequest
  ): Promise<Response> {
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
      for (const [key, value] of new URLSearchParams(`?${search}`).entries()) {
        params[key] = value;
      }
    } else {
      const body = await req.body();
      const decodedBody = new TextDecoder('utf-8').decode(body);
      const contentType = req.headers.get('content-type');
      switch (contentType) {
        case 'application/x-www-form-urlencoded':
          for (const line of decodedBody.split('\n')) {
            const lineParts = line.split(/^(.+?)=(.*)$/);
            if (lineParts.length < 3) {
              continue;
            }
            const key = lineParts[1];
            const value = decodeURI(lineParts[2]);
            params[key] = value;
          }
          break;
        case 'application/json':
          let obj: Object;
          try {
            obj = JSON.parse(decodedBody);
          } catch (e) {
            throw ErrorCode.BadRequest;
          }
          for (const [key, value] of Object.entries(obj)) {
            params[key] = value;
          }
          break;
      }
    }

    const ctx = { path, method, params };
    const result = handler(ctx);
    if (result instanceof Promise) {
      return await (result as Promise<Response>);
    }
    return result;
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
        if (!req.url) {
          throw ErrorCode.NotFound;
        }
        const [path, search] = req.url.split(/\?(.+)/);
        try {
          res =
            (await this.respondStatic(path)) ||
            (await this.respond(path, search, method, req));
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
