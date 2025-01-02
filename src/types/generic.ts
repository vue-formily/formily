export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

export type Builtin = Primitive | FunctionConstructor | Date | Error | RegExp;
