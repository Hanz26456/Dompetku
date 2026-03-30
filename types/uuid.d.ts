declare module 'uuid' {
  export function v4(): string;
  export function v1(): string;
  export function v3(name: string | number[], namespace: string | number[]): string;
  export function v5(name: string | number[], namespace: string | number[]): string;
  export const NIL: string;
  export function version(uuid: string): number;
  export function validate(uuid: string): boolean;
  export function stringify(buffer: number[] | Uint8Array, offset?: number): string;
  export function parse(uuid: string): Uint8Array;
}
