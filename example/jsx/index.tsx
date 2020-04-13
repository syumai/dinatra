/* @jsx h */
import {
  h,
  renderHTML,
} from "https://denopkg.com/syumai/deno-libs/jsx/renderer.ts";
import { app, get } from "https://denopkg.com/syumai/dinatra/mod.ts";

app(
  get("/", () =>
    renderHTML(
      <html>
        <body>Hello, world!</body>
      </html>,
    )),
);
