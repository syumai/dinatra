import { assertEquals } from './vendor/https/deno.land/std/testing/asserts.ts';
import { App, get } from './mod.ts';
import { redirect } from './helpers.ts';
const { test, runTests } = Deno;


const testPort = 8376;
const host = `http://localhost:${testPort}`;
const app = new App(testPort);


app.serve();

test("Redirection does return new endpoint", async () => {

    const original_endpoint = "/original"; 
    const new_endpoint = "/new_endpoint"; 
    const expected_body = `body at ${new_endpoint}`; 

    app.register(get(original_endpoint, () => redirect(new_endpoint)));
    app.register(get(new_endpoint, () => expected_body))

    const response = await fetch(`${host}${original_endpoint}`, { method: "GET" });
    
    assertEquals(response.status, 200);
    assertEquals((await response.text()), expected_body);
});


(async () => {
    await runTests();
    app.close();
})();


