const greeting = 'world';

export function hello(world: string = greeting): string {
  return `Hello ${world}!`;
}
