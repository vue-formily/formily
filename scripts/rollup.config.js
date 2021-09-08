const path = require('path');
const typescript = require('rollup-plugin-typescript2');
const resolve = require('rollup-plugin-node-resolve');

const dirMap = {
  formily: path.resolve(__dirname, `../src/index.ts`)
};

const formatNameMap = {
  formily: 'VueFormily'
};

const pkgNameMap = {
  formily: 'formily'
};

const formatMap = {
  es: 'esm',
  umd: ''
};

const tsPlugin = typescript({
  tsconfig: path.resolve(__dirname, '../tsconfig.json'),
  cacheRoot: path.resolve(__dirname, '../node_modules/.rts2_cache'),
  useTsconfigDeclarationDir: true
});

const package = require(path.resolve(__dirname, `../package.json`));
const version = process.env.VERSION || package.version;

function createConfig(pkg, format) {
  const config = {
    input: {
      input: dirMap[pkg],
      external: ['vue'],
      plugins: [resolve(), tsPlugin]
    },
    output: {
      banner: `/**
  * formily v${version}
  *
  * @link ${package.homepage}
  * @source ${package.repository}
  * (c) ${new Date().getFullYear()} An Ha
  * @license MIT
  */`,
      format,
      name: format === 'umd' ? formatNameMap[pkg] : undefined,
      sourcemap: true,
      globals: {
        vue: 'Vue'
      },
      // Disable warning about mixed named/default exports
      // We we have handled this in the index file
      exports: 'named'
    }
  };

  config.bundleName = `${pkgNameMap[pkg]}${formatMap[format] ? '.' + formatMap[format] : ''}.js`;

  return config;
}

module.exports = {
  formatNameMap,
  pkgNameMap,
  formatMap,
  createConfig
};
