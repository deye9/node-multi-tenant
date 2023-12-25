const greeting = 'world';

export function hello(world: string = greeting): string {
  // eslint-disable-next-line no-console
  console.log(`Hello ${world}!`);
  return `Hello ${world}!`;
}

hello(); // Hello world!
