const { listen, stat, open } = Deno;
import {
  Server,
  ServerRequest,
} from "./vendor/https/deno.land/std/http/server.ts";
import {
  HTTPResponse,
  processResponse,
  Response as AppResponse,
} from "./response.ts";
import { ErrorCode, getErrorMessage } from "./errors.ts";
import { Handler, HandlerConfig, Method } from "./handler.ts";
import { Params, parseURLSearchParams } from "./params.ts";
import { defaultPort } from "./constants.ts";
import { detectedContentType } from "./mime.ts";
import { ReadCloser } from "./io.ts";
export { contentType, detectedContentType } from "./mime.ts";
export {
  del,
  get,
  link,
  options,
  patch,
  post,
  put,
  unlink,
} from "./handler.ts";
export { redirect } from "./helpers.ts";
export type { Response } from "./response.ts";

type HandlerMap = Map<string, Map<string, Handler>>; // Map<method, Map<path, handler>>

interface Responder {
  respondWith(res: Response): void;
  request: Request;
}

export function app(...handlerConfigs: HandlerConfig[]): App {
  const a = new App(defaultPort);
  a.register(...handlerConfigs);
  a.serve();
  return a;
}

export function hook(...handlerConfigs: HandlerConfig[]): App {
  const a = new App(defaultPort);
  a.register(...handlerConfigs);
  a.hook();
  return a;
}

function isReader(v: any): v is Deno.Reader {
  if (v && v.read) {
    return true;
  }
  return false;
}

export class App {
  private handlerMap: HandlerMap = new Map();
  private server!: Server;

  constructor(
    public readonly port = defaultPort,
    public readonly staticEnabled = true,
    public readonly publicDir = "public",
  ) {
    for (const method in Method) {
      this.handlerMap.set(method, new Map());
    }
  }

  // respondStatic returns Response with static file gotten from a path. If a given path didn't match, this method returns null.
  private async respondStatic(path: string): Promise<AppResponse | null> {
    let fileInfo: Deno.FileInfo | null = null;
    let staticFilePath = `${this.publicDir}${path}`;
    try {
      fileInfo = await stat(staticFilePath);
    } catch (e) {
      // Do nothing here.
    }
    if (fileInfo && fileInfo.isDirectory) {
      staticFilePath += "/index.html";
      try {
        fileInfo = await stat(staticFilePath);
      } catch (e) {
        fileInfo = null; // FileInfo is not needed any more.
      }
    }
    if (!fileInfo || !fileInfo.isFile) {
      return null;
    }
    return [
      200,
      {
        "Content-Length": fileInfo.size.toString(),
        ...detectedContentType(staticFilePath),
      },
      await open(staticFilePath),
    ];
  }

  // respond returns Response with from informations of Request.
  private async respond(
    path: string,
    search: string,
    method: Method,
    req: ServerRequest | Request,
  ): Promise<AppResponse | null> {
    const map = this.handlerMap.get(method);
    if (!map) {
      return null;
    }

    const params: Params = {};

    let handler;

    const REGEX_URI_MATCHES = /(:[^/]+)/g;
    const REGEX_URI_REPLACEMENT = "([^/]+)";
    const URI_PARAM_MARKER = ":";

    Array.from(map.keys()).forEach((endpoint) => {
      if (endpoint.indexOf(URI_PARAM_MARKER) !== -1) {
        const matcher = endpoint.replace(
          REGEX_URI_MATCHES,
          REGEX_URI_REPLACEMENT,
        );
        const matches = path.match(`^${matcher}$`);

        if (matches === null) {
          return null;
        }

        const names = endpoint
          .match(REGEX_URI_MATCHES)!
          .map((name) => name.replace(URI_PARAM_MARKER, ""));

        matches.slice(1).forEach((m, i) => {
          params[names[i]] = m;
        });

        handler = map.get(endpoint);
      }
    });

    if (!handler) {
      handler = map.get(path);
    }

    if (!handler) {
      return null;
    }

    if (method === Method.GET) {
      if (search) {
        Object.assign(params, parseURLSearchParams(search));
      }
    } else {
      const rawContentType = req.headers.get("content-type") ||
        "application/octet-stream";
      const [contentType, ...typeParamsArray] = rawContentType
        .split(";")
        .map((s) => s.trim());
      const typeParams = typeParamsArray.reduce((params, curr) => {
        const [key, value] = curr.split("=");
        params[key] = value;
        return params;
      }, {} as { [key: string]: string });

      const decoder = new TextDecoder(typeParams["charset"] || "utf-8"); // TODO: downcase `charset` key
      let decodedBody: string;
      if (isReader(req.body)) {
        decodedBody = decoder.decode(await Deno.readAll(req.body));
      } else {
        const body = (req.body as unknown) as Body;
        decodedBody = await body.text();
      }

      switch (contentType) {
        case "application/x-www-form-urlencoded":
          Object.assign(params, parseURLSearchParams(decodedBody));
          break;
        case "application/json":
          let obj: Object;
          try {
            obj = JSON.parse(decodedBody);
          } catch (e) {
            throw ErrorCode.BadRequest;
          }
          Object.assign(params, obj);
          break;
        case "application/octet-stream":
          // FIXME: we skip here for now, it should be implemented when Issue #41 resolved.
          break;
      }
    }

    const ctx = { path, method, params };
    const res = handler(ctx);
    if (res instanceof Promise) {
      return await (res as Promise<AppResponse>);
    }
    return res;
  }

  public register(...handlerConfigs: HandlerConfig[]) {
    for (const { path, method, handler } of handlerConfigs) {
      this.handlerMap.get(method)!.set(path, handler);
    }
  }

  public unregister(path: string, method: Method) {
    this.handlerMap.get(method)!.delete(path);
  }

  public async handleRequest(
    req: ServerRequest | Request,
  ): Promise<HTTPResponse> {
    const method = req.method as Method;
    let r: AppResponse | undefined;
    if (!req.url) {
      throw ErrorCode.NotFound;
    }
    const [path, search] = req.url.split(/\?(.+)/);
    try {
      r = (await this.respond(path, search, method, req)) ||
        (this.staticEnabled && (await this.respondStatic(path))) ||
        undefined;
      if (!r) {
        throw ErrorCode.NotFound;
      }
    } catch (err) {
      let status = ErrorCode.InternalServerError;
      if (typeof err === "number") {
        status = err;
      } else {
        console.error(err);
      }
      r = [status, getErrorMessage(status)];
    }
    return processResponse(r);
  }

  public async serve() {
    const hostname = "0.0.0.0";
    const listener = listen({ hostname, port: this.port });
    console.log(`listening on http://${hostname}:${this.port}/`);
    this.server = new Server(listener);
    for await (const req of this.server) {
      const res = await this.handleRequest(req);
      await req.respond(res);
      if (isReadCloser(res.body)) {
        res.body.close();
      }
    }
  }

  public async hook() {
    addEventListener("fetch", async (event) => {
      const e = (event as unknown) as Responder;
      const req = e.request;
      const res = await this.handleRequest(req);
      let rawData: Uint8Array;
      if (isReader(res.body)) {
        rawData = await Deno.readAll(res.body);
      } else {
        rawData = res.body as Uint8Array;
      }
      const body = new Blob([rawData], { type: "application/octet-binary" });
      e.respondWith(
        new Response(body, {
          status: res.status,
          headers: res.headers,
        }),
      );
    });
  }

  public close() {
    this.server.close();
  }
}

function isReadCloser(obj: any): obj is ReadCloser {
  const o = obj as ReadCloser;
  return (
    typeof o === "object" &&
    typeof o.read === "function" &&
    typeof o.close === "function"
  );
}
