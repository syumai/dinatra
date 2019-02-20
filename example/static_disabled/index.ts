import { defaultPort } from '../../constants.ts';
import { App, get } from '../../mod.ts';

const app = new App(defaultPort, false);
app.handle(get('/hello', () => 'hello'));
app.serve();
