import { Response } from "./response.ts";

export function redirect(path: string, code: number = 302): Response {
  return [code, { location: path }, ""];
}
