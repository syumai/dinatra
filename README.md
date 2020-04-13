# dinatra

[![Build Status](https://github.com/syumai/dinatra/workflows/test/badge.svg?branch=master)](https://github.com/syumai/dinatra/actions)

- [Sinatra](http://sinatrarb.com/) like light weight web app framework for [Deno](https://github.com/denoland/deno).
- This app is using [Deno Standard Modules](https://github.com/denoland/deno_std).
- **All features of this app are currently experimental**.

## Usage

`example/index.ts`

```ts
import {
  app,
  get,
  post,
  redirect,
  contentType,
} from "https://denopkg.com/syumai/dinatra@0.10.1/mod.ts";

app(
  get("/hello", () => "hello"),
  get("/hello/:id", ({ params }) => params.id),
  get(
    "/hello/:id/and/:name",
    ({ params }) => `:id is ${params.id}, :name is ${params.name}`,
  ),
  get("/error", () => [500, "an error has occured"]),
  get("/callName", ({ params }) => `Hi, ${params.name}!`),
  post("/callName", ({ params }) => `Hi, ${params.name}!`),
  get("/foo", () => redirect("/hello", 302)), // redirect from /foo to /hello
  get("/info", () => [
    200,
    contentType("json"),
    JSON.stringify({ app: "dinatra", version: "0.0.1" }),
  ]),
);
```

```console
deno run --allow-net --allow-read index.ts # Or simply: deno run -A index.ts
# App runs on localhost:8080

curl http://localhost:8080/hello
# status: 200
# body: hello

curl http://localhost:8080/hello/1
# status: 200
# body: 1

curl http://localhost:8080/hello/1/and/John
# status: 200
# body: :id is 1, :name is John

curl http://localhost:8080/error
# status: 500
# body: an error has occured

curl http://localhost:8080/callName?name=John
# status: 200
# body: Hi, John!

curl -d 'name=Tom' http://localhost:8080/callName
# status: 200
# body: Hi, Tom!

curl http://localhost:8080/foo
# status: 302
# location: /hello

curl http://localhost:8080/info
# status: 200
# content-type: application/json
# body: {"app":"dinatra","version":"0.0.1"}
```

### Async Handler

- You can use async function as handler.

[`example/template/index.ts`](https://github.com/syumai/dinatra/tree/master/example/template)

```ts
const { cwd, open } = Deno;
import { app, get } from 'https://denopkg.com/syumai/dinatra/mod.ts';

const currentDir = cwd();
const htmlPath = `${currentDir}/index.html`;

app(get('/', async () => await open(htmlPath)));
```

### Template

- You can use [dejs](https://github.com/syumai/dejs) (ejs for deno) as dinatra's template engine.

```ts
import { renderFile } from 'https://deno.land/x/dejs/dejs.ts';

app(
  get('/', async () => await renderFile('index.ejs', { message: 'example' }))
);
```

### Host static files

- Files in `./public` directory will be served static.

### Close server

```ts
import { app, get } from 'https://denopkg.com/syumai/dinatra/mod.ts';

const s = app(get('/', () => 'hello'));

setTimeout(() => {
  s.close(); // close server after 5s.
}, 5000);
```

## Flags

```console
deno run -A index.ts -p 8000 # or --port=8000
# App runs on localhost:8000
```

## Initialization options

### Customize static file hosting option

```ts
import { defaultPort } from 'https://denopkg.com/syumai/dinatra/constants.ts';
import { App, get } from 'https://denopkg.com/syumai/dinatra/mod.ts';

const app = new App(
  defaultPort, // portNumber (number)
  'dist', // public file directory's path (string)
  false // option to enable static file hosting (boolean)
);

app.register(get('/hello', () => 'hello'));
```

## Response Types

```ts
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
```

## Status

### Request Params

- [x] URL query params (for GET)
- [x] route params (like: `/users/:user_id/posts`)
- [x] x-www-form-urlencoded
- [x] redirect
- [x] application/json
- [ ] application/octet-stream

## Development

### Update module

- Please use [dem](https://github.com/syumai/dem)

```
dem update https://deno.land/std@v0.xx.x
```

### Lint

- `make lint`

### Format

- `make fmt`

### Testing

- `make test`

## Author

syumai

## License

MIT
