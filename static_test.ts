import { test } from 'https://deno.land/x/testing/testing.ts';
import { exit } from 'deno';
import { assertEqual } from 'https://deno.land/x/pretty_assert@0.1.1/index.ts';
import { App } from './dinatra.ts';

const testPort = '8376';
const host = `http://localhost:${testPort}`;

const app = new App(testPort, 'testdata/static');
app.serve();

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  interface testCase {
    name: string;
    path: string;
    expected: string;
  }

  const testCases: Array<testCase> = [
    {
      name: 'valid normal path',
      path: 'index.js',
      expected: 'ok',
    },
    {
      name: 'valid index path',
      path: '',
      expected: 'ok',
    },
    {
      name: 'valid nested normal path',
      path: 'nested/index.js',
      expected: 'ok',
    },
    {
      name: 'valid nested index path',
      path: 'nested',
      expected: 'ok',
    },
    {
      name: 'invalid not found',
      path: 'nonExistencePath',
      expected: 'not found',
    },
    {
      name: 'invalid parent path',
      path: '../static_test.ts',
      expected: 'not found',
    },
  ];

  for (const tc of testCases) {
    test({
      name: tc.name,
      async fn() {
        await sleep(50);
        const res = await fetch(`${host}/${tc.path}`);
        const actual = await res.text();
        const contentLength = res.headers.get('content-length');
        assertEqual(actual, tc.expected);
        assertEqual(contentLength, tc.expected.length.toString());
      },
    });
  }

  await sleep(500);
  exit(0);
})();
