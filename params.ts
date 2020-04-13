export interface Params {
  [key: string]: any;
}

export function parseURLSearchParams(paramsStr: string): Params {
  const params: Params = {};
  const spaceReplacedStr = paramsStr.replace(/\+/g, " "); // replace all + to spaces
  for (const [key, value] of new URLSearchParams(spaceReplacedStr).entries()) {
    params[key] = value;
  }
  return params;
}
