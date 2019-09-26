const { args } = Deno;
import { parse } from './vendor/https/deno.land/std/flags/mod.ts';

export const parsedArgs: {
  p?: string;
  port?: string;
  [key: string]: any;
} = parse(args) || {};

export const defaultPort = parsedArgs.p || parsedArgs.port || '8080';
