const { cwd } = Deno;
import { app, get, post } from "../../mod.ts";
import { renderFile } from "https://deno.land/x/dejs@0.3.1/mod.ts";

const templatePath = `${cwd()}/index.ejs`;

app(
  get(
    "/",
    async () => await renderFile(templatePath, { name: "", message: "" }),
  ),
  post(
    "/posts",
    async ({ params: { name, message } }) =>
      await renderFile(templatePath, { name, message }),
  ),
);
