import { Response } from './response';

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

export interface Params {
  [key: string]: any;
}

export type Context = {
  readonly path: string;
  readonly method: Method;
  params?: Params;
};

export interface Handler {
  (ctx?: Context): Response;
}

export type HandlerConfig = {
  path: string;
  method: Method;
  handler: Handler;
};

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
