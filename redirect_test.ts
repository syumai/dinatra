import { assertEquals } from './vendor/https/deno.land/std/testing/asserts.ts';
import { App, get } from './mod.ts';
import { redirect } from './handler.ts';
const { test, runTests } = Deno;


const testPort = 8376;
const host = `http://localhost:${testPort}`;
const app = new App(testPort);

app.register(get("original", redirect("/new", 301))); 
app.serve();

test("Redirection does return correct status code", async () => {

    const response = await fetch(`${host}/original`, { method: "get" });
    assertEquals(response.status, 301);
});

test("Redirection does return change location", async () => {

    const response = await fetch(`${host}/original`);
    const location = response.headers.get("location");
    assertEquals(location, "/new");
});

(async () => {
    await runTests();
    app.close();
})();


