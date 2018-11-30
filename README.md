# denatra

- [Sinatra](http://sinatrarb.com/) like light weight web app framework for [deno](https://github.com/denoland/deno).
- This app using [Deno Networking Libraries](https://github.com/denoland/net).
- **All features of this app is currently experimental**.

## Status

**WIP**

## Usage

`example/index.ts`

```ts
import {
  app,
  get,
} from 'https://raw.githubusercontent.com/syumai/denatra/master/denatra.ts';

app(
  get('/hello', () => 'hello'),
  get('/error', () => [500, 'an error has occured'])
);
```

```console
deno index.ts
# This app runs on localhost:8080

curl http://localhost:8080/hello
# status: 200
# body: hello

curl http://localhost:8080/hello
# status: 500
# body: an error has occured
```
