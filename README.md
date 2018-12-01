# dinatra

- [Sinatra](http://sinatrarb.com/) like light weight web app framework for [deno](https://github.com/denoland/deno).
- This app using [Deno Networking Libraries](https://github.com/denoland/net).
- **All features of this app is currently experimental**.

## Status

**WIP**

- GET only works now.

## Usage

`example/index.ts`

```ts
import {
  app,
  get,
} from 'https://syumai.github.io/dinatra/dinatra.ts';

app(
  get('/hello', () => 'hello'),
  get('/error', () => [500, 'an error has occured'])
  get('/callName', ({ params }) => `Hi, ${params.name}!`),
  get('/info', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify({ app: 'dinatra', version: '0.0.1' }),
  ])
);
```

```console
deno index.ts
# This app runs on localhost:8080

curl http://localhost:8080/hello
# status: 200
# body: hello

curl http://localhost:8080/error
# status: 500
# body: an error has occured

curl http://localhost:8080/callName?name=John
# status: 200
# body: Hi, John!

curl http://localhost:8080/info
# status: 200
# content-type: application/json
# body: {"app":"dinatra","version":"0.0.1"}
```

## Response Types

```ts
export type Response =
  | StatusHeadersBodyResponse
  | StatusBodyResponse
  | number // HTTP status code only
  | string; // Response body only

type StatusHeadersBodyResponse = [number, HeaderMap, string];
type StatusBodyResponse = [number, string];
```
