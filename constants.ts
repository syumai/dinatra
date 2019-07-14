const { args } = Deno;
import { parse } from 'https://deno.land/std@v0.11.0/flags/mod.ts';

export const parsedArgs: {
  p?: string;
  port?: string;
  [key: string]: any;
} = parse(args) || {};

export const defaultPort = parsedArgs.p || parsedArgs.port || '8080';
