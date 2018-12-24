import { app, get, post } from '../../dinatra.ts';
import { cwd, open, Buffer } from 'deno';

const currentDir = cwd();
const template = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Form example</title>
  </head>
  <body>
    <%BODY%>
  </body>
</html>`;

const filePath = (filename: string): string => `${currentDir}/${filename}.html`;

const readFile = async (filename: string): Promise<string> => {
  const file = await open(filePath(filename));
  const buf = new Buffer();
  await buf.readFrom(file);
  return buf.toString();
};

const render = async (body: string): Promise<string> => {
  return template.replace('<%BODY%>', body);
};

app(
  get('/', async () => {
    const form = await readFile('form');
    return await render(form);
  }),
  post('/name', async ({ params }) => {
    const form = await readFile('form');
    const body = `<h2>
  Hi, ${params.name}!
</h2>
${form}`;
    return await render(body);
  })
);
