import { app, get, post } from '../../dinatra.ts';
import { cwd, copy, open, stdout } from 'deno';
import { render } from 'https://syumai.github.io/dpl/dpl.ts';

const templatePath = `${cwd()}/index.ejs`;

app(
  get('/', async () => await render(templatePath, { message: '' })),
  post(
    '/name',
    async ({ params: { name } }) =>
      await render(templatePath, { message: `Hi, ${name}!` })
  )
);
