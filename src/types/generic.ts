export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

export type Builtin = Primitive | FunctionConstructor | Date | Error | RegExp;

export type ValueOf<T> = T[keyof T];

// Merge util
export type WithDefaults<P, D> = {
  [K in keyof (P & D)]: K extends keyof P ? P[K] : K extends keyof D ? D[K] : never;
};

export type KnownKeys<T> = keyof {
  [K in keyof T as K extends string
    ? string extends K
      ? never
      : K
    : K extends number
      ? number extends K
        ? never
        : K
      : K extends symbol
        ? symbol extends K
          ? never
          : K
        : never]: 0;
};

export type Simplify<T> = { [K in keyof T]: T[K] } & {};
export type Override<T, R> = Omit<T, keyof R> & R;

// export type ReadonlySchema<T> = T extends Builtin
//   ? T
//   : T extends Array<any>
//   ? Readonly<T>
//   : T extends Record<string, any>
//   ? { readonly [K in keyof T]: ReadonlySchema<T[K]> }
//   : Readonly<T>;
