import { assertEquals } from './vendor/https/deno.land/std/testing/asserts.ts';
import { App } from './mod.ts';
const { exit, test, runTests } = Deno;

const testPort = 8376;
const host = `http://localhost:${testPort}`;

const app = new App(testPort, true, 'testdata/static');
app.serve();

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
      const res = await fetch(`${host}/${tc.path}`);
      const actual = await res.text();
      const contentLength = res.headers.get('content-length');
      assertEquals(actual, tc.expected);
      assertEquals(contentLength, tc.expected.length.toString());
    },
  });
}

(async () => {
  await runTests();
  exit(0);
})();
