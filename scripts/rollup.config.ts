import path from 'path';
import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import { RollupOptions, OutputOptions, Plugin } from 'rollup';
import replace from '@rollup/plugin-replace';
// Import JSON nhờ resolveJsonModule: true trong tsconfig
import pkg from '../package.json';

// --- CONFIG PATHS (Tính từ Root Project) ---
const entryPath = path.resolve('src/index.ts');
const tsconfigPath = path.resolve('tsconfig.json');
const cacheRootPath = path.resolve('node_modules/.rts2_cache');

export const dirMap: Record<string, string> = {
  formily: entryPath
};

export const formatNameMap: Record<string, string> = {
  formily: 'VueFormily'
};

export const pkgNameMap: Record<string, string> = {
  formily: 'formily'
};

export const formatMap: Record<string, string> = {
  es: 'esm',
  umd: ''
};

const tsPlugin = typescript({
  tsconfig: tsconfigPath,
  cacheRoot: cacheRootPath,
  useTsconfigDeclarationDir: true
});

const version = process.env.VERSION || pkg.version;

export function createConfig(packageName: string, format: 'es' | 'umd'): RollupOptions & { bundleName: string } {
  const bundleName = `${pkgNameMap[packageName]}${formatMap[format] ? '.' + formatMap[format] : ''}.js`;

  const config = {
    input: dirMap[packageName],
    external: ['vue', '@vue-formily/util'],
    plugins: [
      resolve() as Plugin,
      tsPlugin,
      replace({
        preventAssignment: true,
        values: {
          __DEV__: format === 'umd' ? 'false' : `(process.env.NODE_ENV !== 'production')`
        }
      })
    ],
    output: {
      file: `dist/${bundleName}`,
      banner: `/**
  * formily v${version}
  *
  * @link ${pkg.homepage}
  * @source ${pkg.repository}
  * (c) ${new Date().getFullYear()} An Ha
  * @license MIT
  */`,
      format,
      name: format === 'umd' ? formatNameMap[packageName] : undefined,
      sourcemap: true,
      globals: {
        vue: 'Vue',
        '@vue-formily/util': 'VueFormilyUtil'
      },
      exports: 'named'
    } as OutputOptions
  };

  return {
    ...config,
    bundleName
  };
}
