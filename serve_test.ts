import { test, runTests } from 'https://deno.land/std/testing/mod.ts';
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';
import { App, get, post } from './mod.ts';
import { HandlerConfig, Method } from './handler.ts';
const { exit } = Deno;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

type HeadersInit = Headers | string[][] | Record<string, string>;

interface RequestInit {
  body?: string | FormData;
  headers?: Record<string, string>;
  method?: string;
}

const testPort = '8376';
const host = `http://localhost:${testPort}`;

interface testCase {
  name: string;
  registered: HandlerConfig;
  path: string;
  method: Method;
  params?: string | FormData;
  headers?: Record<string, string>;
  expected: string;
}

const testCases: Array<testCase> = [
  {
    name: 'valid basic handler',
    registered: get('/basic', () => 'basic'),
    path: 'basic',
    method: Method.GET,
    expected: 'basic',
  },
  {
    name: 'valid async handler',
    registered: get('/async', async () => 'async'),
    path: 'async',
    method: Method.GET,
    expected: 'async',
  },
  {
    name: 'valid get params',
    registered: get('/params', ({ params }) => params.name),
    path: 'params?name=john',
    method: Method.GET,
    expected: 'john',
  },
  {
    name: 'valid post',
    registered: post('/params', ({ params }) => [200, params.name]),
    path: 'params',
    params: JSON.stringify({ name: 'ben' }),
    method: Method.POST,
    expected: 'ben'
  },
  {
    name: 'valid post with detailed content-type',
    registered: post('/params', ({ params }) => [200, params.name]),
    path: 'params',
    params: JSON.stringify({ name: 'tom' }),
    headers: { 'content-type': 'application/json; charset=utf-8' },
    method: Method.POST,
    expected: 'tom'
  }
  // this test doesn't pass because deno's fetch is broken.
  // {
  //   name: 'valid post formdata',
  //   registered: post('/params', ({ params }) => params.name),
  //   path: 'params',
  //   params: (() => {
  //     const fd = new FormData();
  //     fd.append('name', 'tom');
  //     return fd;
  //   })(),
  //   method: Method.POST,
  //   expected: 'tom',
  // },
];

function newApp(handler: HandlerConfig): App {
  const app = new App(testPort);
  app.handle(handler);
  return app;
}

for (const tc of testCases) {
  test({
    name: tc.name,
    async fn() {
      const app = newApp(tc.registered);
      app.serve();

      const reqInit: RequestInit = { method: tc.method };
      if (typeof tc.params === 'string') {
        reqInit.body = tc.params;
        reqInit.headers = tc.headers || { 'content-type': 'application/json' };
      } else {
        reqInit.body = tc.params;
      }
      const res = await fetch(`${host}/${tc.path}`, reqInit);
      const actual = await res.text();
      const contentLength = res.headers.get('content-length');

      assertEquals(actual, tc.expected);
      assertEquals(contentLength, tc.expected.length.toString());

      app.close();
      await sleep(100); // Workaround to avoid `AddrInUse`
    },
  });
}

(async () => {
  await runTests();
  exit(0);
})();
