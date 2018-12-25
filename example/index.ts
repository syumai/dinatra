import { app, get, post } from '../dinatra.ts';

app(
  get('/hello', () => 'hello'),
  get('/error', () => [500, 'an error has occured']),
  get('/callName', ({ params }) => `Hi, ${params.name}!`),
  post('/callNamePost', ({ params }) => `Hi, ${params.name}!`),
  get('/info', () => [
    200,
    { 'Content-Type': 'application/json' },
    JSON.stringify({ app: 'dinatra', version: '0.0.1' }),
  ])
);
