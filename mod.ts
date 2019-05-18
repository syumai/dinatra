const { stat, open, readAll } = Deno;
import { ServerRequest, serve } from './std/http/server.ts';
import {
  Deferred,
  defer,
} from 'https://deno.land/x/std@v0.2.11/util/deferred.ts';
import { decode } from 'https://deno.land/std/strings/strings.ts';
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

export function app(...handlerConfigs: HandlerConfig[]): App {
  const a = new App(defaultPort);
  a.handle(...handlerConfigs);
  a.serve();
  return a;
}

export class App {
  private handlerMap: HandlerMap = new Map();
  private cancel: Deferred = defer();

  constructor(
    public readonly port = defaultPort,
    public readonly staticEnabled = true,
    public readonly publicDir = 'public'
  ) {
    for (const method in Method) {
      this.handlerMap.set(method, new Map());
    }
  }

  // respondStatic returns Response with static file gotten from a path. If a given path didn't match, this method returns null.
  private async respondStatic(path: string): Promise<Response> {
    let fileInfo: Deno.FileInfo;
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
        fileInfo = null; // FileInfo is not needed any more.
      }
    }
    if (!fileInfo || !fileInfo.isFile()) {
      return null;
    }
    return [
      200,
      {
        'Content-Length': fileInfo.len.toString(),
        ...detectedContentType(staticFilePath),
      },
      await open(staticFilePath),
    ];
  }

  // respond returns Response with from informations of Request.
  private async respond(
    path,
    search: string,
    method: Method,
    req: ServerRequest
  ): Promise<Response> {
    const map = this.handlerMap.get(method);
    if (!map) {
      return null;
    }

    const handler = map.get(path);
    if (!handler) {
      return null;
    }

    const params: Params = {};
    if (method === Method.GET) {
      if (search) {
        for (const [key, value] of new URLSearchParams(search).entries()) {
          params[key] = value;
        }
      }
    } else {
      const decodedBody = decode(await readAll(req.body)); // FIXME: this line is broken
      const contentType = req.headers.get('content-type');
      switch (contentType) {
        case 'application/x-www-form-urlencoded':
          for (const [key, value] of new URLSearchParams(
            decodedBody
          ).entries()) {
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
    const res = handler(ctx);
    if (res instanceof Promise) {
      return await (res as Promise<Response>);
    }
    return res;
  }

  public handle(...handlerConfigs: HandlerConfig[]) {
    for (const { path, method, handler } of handlerConfigs) {
      this.handlerMap.get(method).set(path, handler);
    }
  }

  public async serve() {
    const addr = `0.0.0.0:${this.port}`;
    console.log(`listening on http://${addr}/`);
    for await (const { req, res } of serve(addr, this.cancel)) {
      const method = req.method as Method;
      let r: Response;
      if (!req.url) {
        throw ErrorCode.NotFound;
      }
      const [path, search] = req.url.split(/\?(.+)/);
      try {
        r =
          (await this.respond(path, search, method, req)) ||
          (this.staticEnabled && (await this.respondStatic(path)));
        if (!r) {
          throw ErrorCode.NotFound;
        }
      } catch (err) {
        let status = ErrorCode.InternalServerError;
        if (typeof err === 'number') {
          status = err;
        }
        r = [status, getErrorMessage(status)];
      }
      await res.respond(processResponse(r));
    }
  }

  public close() {
    this.cancel.resolve();
  }
}
