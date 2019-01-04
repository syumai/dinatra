import { app, get, post, contentType } from '../mod.ts';

app(
  get('/hello', () => 'hello'),
  get('/error', () => [500, 'an error has occured']),
  get('/callName', ({ params }) => `Hi, ${params.name}!`),
  post('/callName', ({ params }) => `Hi, ${params.name}!`),
  get('/info', () => [
    200,
    contentType('json'),
    JSON.stringify({ app: 'dinatra', version: '0.0.1' }),
  ])
);
