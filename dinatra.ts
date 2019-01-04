import { color } from 'https://deno.land/x/colors@v0.2.4/main.ts';
export * from './mod.ts';

console.log(color.yellow('Using dinatra/dinatra.ts is now deprecated.'));
console.log(
  color.yellow('Instead of this, please use ') +
    color.yellow.bold('https://denopkg.com/syumai/dinatra/mod.ts')
);
