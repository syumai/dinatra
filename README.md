# dinatra

- [Sinatra](http://sinatrarb.com/) like light weight web app framework for [deno](https://github.com/denoland/deno).
- This app is using [Deno Standard Modules](https://github.com/denoland/deno_std).
- **All features of this app are currently experimental**.

## Usage

`example/index.ts`

```ts
import { app, get, post } from 'https://syumai.github.io/dinatra/dinatra.ts';

app(
  get('/hello', () => 'hello'),
  get('/error', () => [500, 'an error has occured']),
  get('/callName', ({ params }) => `Hi, ${params.name}!`),
  post('/callName', ({ params }) => `Hi, ${params.name}!`),
  get('/info', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify({ app: 'dinatra', version: '0.0.1' }),
  ])
);
```

```console
deno index.ts
# App runs on localhost:8080

curl http://localhost:8080/hello
# status: 200
# body: hello

curl http://localhost:8080/error
# status: 500
# body: an error has occured

curl http://localhost:8080/callName?name=John
# status: 200
# body: Hi, John!

curl -d 'name=Tom' http://localhost:8080/callName
# status: 200
# body: Hi, Tom!

curl http://localhost:8080/info
# status: 200
# content-type: application/json
# body: {"app":"dinatra","version":"0.0.1"}
```

### Async Handler

- You can use async function as handler.

[`example/template/index.ts`](https://github.com/syumai/dinatra/tree/master/example/template)

```ts
import { app, get } from '../../dinatra.ts';
import { cwd, open } from 'deno';

const currentDir = cwd();
const htmlPath = `${currentDir}/index.html`;

app(get('/', async () => await open(htmlPath)));
```

## Launch Options

```console
deno index.ts -p 8000 # or --port=8000
# App runs on localhost:8000
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
type ResponseBody = string | Reader;

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

// Response interface of deno.land/x/net/http
interface HTTPResponse {
  status?: number;
  headers?: Headers;
  body?: Uint8Array | Reader;
}
```

## Status

### Request Params

- [x] URL query params (for GET)
- [ ] route params (like: `/users/:user_id/posts`)
- [x] x-www-form-urlencoded
- [x] application/json
