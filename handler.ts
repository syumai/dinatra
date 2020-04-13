import { Response } from './response.ts';
import { Params } from './params.ts';

export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  LINK = 'LINK',
  UNLINK = 'UNLINK',
}

export type Context = {
  readonly path: string;
  readonly method: Method;
  params: Params;
};

export type Handler = BasicHandler | AsyncHandler;

export interface BasicHandler {
  (ctx: Context): Response;
}

export interface AsyncHandler {
  (ctx: Context): Promise<Response>;
}

export type HandlerConfig = {
  path: string;
  method: Method;
  handler: Handler;
};


export function redirect(path: string, code: number): Handler {

  //[number, HeaderMap, ResponseBody];
  return (context: Context) => {
    return [code, {location: path }, ""]; 
  }
}


export function get(path: string, handler: Handler): HandlerConfig {
  return { path, method: Method.GET, handler };
}

export function post(path: string, handler: Handler): HandlerConfig {
  return { path, method: Method.POST, handler };
}

export function put(path: string, handler: Handler): HandlerConfig {
  return { path, method: Method.PUT, handler };
}

export function patch(path: string, handler: Handler): HandlerConfig {
  return { path, method: Method.PATCH, handler };
}

export function del(path: string, handler: Handler): HandlerConfig {
  return { path, method: Method.DELETE, handler };
}

export function options(path: string, handler: Handler): HandlerConfig {
  return { path, method: Method.OPTIONS, handler };
}

export function link(path: string, handler: Handler): HandlerConfig {
  return { path, method: Method.LINK, handler };
}

export function unlink(path: string, handler: Handler): HandlerConfig {
  return { path, method: Method.UNLINK, handler };
}
