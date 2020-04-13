import { defaultPort } from "../../constants.ts";
import { App, get } from "../../mod.ts";

const app = new App(defaultPort, false);
app.register(get("/hello", () => "hello"));
app.serve();
