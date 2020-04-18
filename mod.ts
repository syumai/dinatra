const { listen, stat, open, readAll } = Deno;
import {
  Server,
  ServerRequest,
} from "./vendor/https/deno.land/std/http/server.ts";
import { Response, processResponse } from "./response.ts";
import { ErrorCode, getErrorMessage } from "./errors.ts";
import { Method, Handler, HandlerConfig } from "./handler.ts";
import { Params, parseURLSearchParams } from "./params.ts";
import { defaultPort } from "./constants.ts";
import { detectedContentType } from "./mime.ts";
export { contentType, detectedContentType } from "./mime.ts";
export {
  get,
  post,
  put,
  patch,
  del,
  options,
  link,
  unlink,
} from "./handler.ts";
export { redirect } from "./helpers.ts";
export { Response } from "./response.ts";

type HandlerMap = Map<string, Map<string, Handler>>; // Map<method, Map<path, handler>>

export function app(...handlerConfigs: HandlerConfig[]): App {
  const a = new App(defaultPort);
  a.register(...handlerConfigs);
  a.serve();
  return a;
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
  private async respondStatic(path: string): Promise<Response | null> {
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
    req: ServerRequest,
  ): Promise<Response | null> {
    const map = this.handlerMap.get(method);

    if (!map) {
      return null;
    }

    const params: Params = {};
    let body: Object | null = null;

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
      const decodedBody = decoder.decode(await readAll(req.body));

      switch (contentType) {
        case "application/x-www-form-urlencoded":
          Object.assign(params, parseURLSearchParams(decodedBody));
          break;
        case "application/json":
          try {
            body = JSON.parse(decodedBody);
          } catch (e) {
            throw ErrorCode.BadRequest;
          }
          //Object.assign(params, body);
          break;
        case "application/octet-stream":
          // FIXME: we skip here for now, it should be implemented when Issue #41 resolved.
          break;
      }
    }

    const ctx = { path, method, params, body };
    const res = handler(ctx);
    if (res instanceof Promise) {
      return await (res as Promise<Response>);
    }
    return res;
  }

  // Deprecated
  public handle = (...args: HandlerConfig[]) => {
    console.error("handle is deprecated. Please use register instead of this.");
    this.register(...args);
  };

  public register(...handlerConfigs: HandlerConfig[]) {
    for (const { path, method, handler } of handlerConfigs) {
      this.handlerMap.get(method)!.set(path, handler);
    }
  }

  public unregister(path: string, method: Method) {
    this.handlerMap.get(method)!.delete(path);
  }

  public async serve() {
    const hostname = "0.0.0.0";
    const listener = listen({ hostname, port: this.port });
    console.log(`listening on http://${hostname}:${this.port}/`);
    this.server = new Server(listener);
    for await (const req of this.server) {
      const method = req.method as Method;
      let r: Response | undefined;
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
      const res = processResponse(r);
      await req.respond(res);
      if (isReadCloser(res.body)) {
        res.body.close();
      }
    }
  }

  public close() {
    this.server.close();
  }
}

function isReadCloser(obj: any): obj is Deno.ReadCloser {
  const o = obj as Deno.ReadCloser;
  return (
    typeof o === "object" &&
    typeof o.read === "function" &&
    typeof o.close === "function"
  );
}
