const { cwd, open } = Deno;
import { app, get } from "../../mod.ts";

const currentDir = cwd();
const htmlPath = `${currentDir}/index.html`;

app(get("/", async () => await open(htmlPath)));
