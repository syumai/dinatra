import { app, get } from 'https://raw.githubusercontent.com/syumai/denatra/master/denatra.ts';

app(
  get('/hello', () => 'hello'),
  get('/world', () => 'world'),
  get('/fuga', () => 'fuga'),
  get('/hoge', () => 'hoge')
);
