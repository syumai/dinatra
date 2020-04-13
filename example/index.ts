import { app, get, post, redirect, contentType } from "../mod.ts";

app(
  get("/hello", () => "hello"),
  get("/hello/:id", ({ params }) => params.id),
  get(
    "/hello/:id/and/:name",
    ({ params }) => `:id is ${params.id}, :name is ${params.name}`,
  ),
  get("/error", () => [500, "an error has occured"]),
  get("/callName", ({ params }) => `Hi, ${params.name}!`),
  post("/callName", ({ params }) => `Hi, ${params.name}!`),
  get("/foo", () => redirect("/hello", 302)), // redirect from /foo to /hello
  get("/info", () => [
    200,
    contentType("json"),
    JSON.stringify({ app: "dinatra", version: "0.0.1" }),
  ]),
);
