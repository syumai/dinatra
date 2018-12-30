import { app, get, post } from '../../dinatra.ts';
import { cwd, copy, open, stdout } from 'deno';
import { renderFile } from 'https://syumai.github.io/dejs/dejs.ts';

const templatePath = `${cwd()}/index.ejs`;

app(
  get('/', async () => await renderFile(templatePath, { message: '' })),
  post(
    '/name',
    async ({ params: { name } }) =>
      await renderFile(templatePath, { message: `Hi, ${name}!` })
  )
);
