import { assertEquals } from "./vendor/https/deno.land/std/testing/asserts.ts";
import { App, get } from "./mod.ts";
import { redirect } from "./helpers.ts";

const testPort = 8376;
const host = `http://localhost:${testPort}`;

Deno.test("Redirection does return new endpoint", async () => {
  const app = new App(testPort);
  app.serve();

  const originalEndpoint = "/original";
  const newEndpoint = "/new_endpoint";
  const expectedBody = `body at ${newEndpoint}`;

  app.register(get(originalEndpoint, () => redirect(newEndpoint)));
  app.register(get(newEndpoint, () => expectedBody));

  const response = await fetch(
    `${host}${originalEndpoint}`,
    { method: "GET" },
  );

  assertEquals(response.status, 200);
  assertEquals(await response.text(), expectedBody);

  app.close();
});
