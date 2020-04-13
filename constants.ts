const { args } = Deno;
import { parse } from "./vendor/https/deno.land/std/flags/mod.ts";

export const parsedArgs: {
  p?: string;
  port?: string;
  [key: string]: any;
} = parse(args) || {};

export const defaultPort = (() => {
  const { p, port } = parsedArgs;
  if (p) {
    try {
      return parseInt(p, 10);
    } catch (e) {
      // ignore parse error
    }
  }
  if (port) {
    try {
      return parseInt(port, 10);
    } catch (e) {
      // ignore parse error
    }
  }
  return 8080; // default port
})();
