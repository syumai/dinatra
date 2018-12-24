import { app, get } from '../../dinatra.ts';
import { cwd, open } from 'deno';

const currentDir = cwd();
const htmlPath = `${currentDir}/index.html`;

app(get('/', async () => await open(htmlPath)));
