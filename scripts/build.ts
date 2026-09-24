import path from 'path';
import fs from 'fs-extra';
import { OutputOptions, rollup } from 'rollup';
import chalk from 'chalk';
import { minify } from 'terser';
import shell from 'shelljs';

import { createConfig } from './rollup.config';
import { reportSize } from './info';
import { generateDts } from './generate-dts';

// Get absolute path to dist folder from project root
const dist = path.resolve('dist');

// const babelBin = path.join(process.cwd(), 'node_modules', '.bin', 'babel');

/**
 * Minify code using Terser
 */
async function runMinify({ code, bundleName }: { code: string; bundleName: string }) {
  const output = await minify(code, {
    toplevel: true,
    compress: {
      ecma: 2018,
      pure_getters: true,
      unsafe: true,
      unsafe_arrows: true,
      passes: 2,
      drop_console: true,
      drop_debugger: true
    },
    mangle: {
      properties: {
        regex: /^_/,
        reserved: ['__esModule', '_isVue']
      }
    },
    sourceMap: {
      filename: bundleName.replace(/\.js$/, '.min.js'),
      url: bundleName.replace(/\.js$/, '.min.js.map')
    }
  });

  if (!output.code) return;

  const fileName = bundleName.replace(/\.js$/, '.min.js');
  const filePath = path.join(dist, fileName);

  fs.outputFileSync(filePath, output.code);

  if (output.map) {
    fs.outputFileSync(`${filePath}.map`, output.map as string);
  }

  const stats = reportSize({ code: output.code, path: filePath });

  console.log(`${chalk.green('Output File:')} ${fileName} ${stats}`);
}

/**
 * Main Build function
 */
async function build(pkgName: string) {
  // Define formats to build
  const formats = ['es', 'umd'] as const;

  for (const format of formats) {
    // Get config from rollup.config.ts
    const config = createConfig(pkgName, format);
    const { input, output, bundleName } = config;

    // 1. Create Bundle
    const bundle = await rollup({
      input,
      external: config.external,
      plugins: config.plugins
    });

    // 2. Generate code
    const generated = await bundle.write(output as OutputOptions);
    const code = generated.output[0].code;

    // 3. Write file to disk
    const outputPath = path.join(dist, bundleName);
    fs.outputFileSync(outputPath, code);

    // 4. Report size
    const stats = reportSize({ code, path: outputPath });
    console.log(`${chalk.green('Output File:')} ${bundleName} ${stats}`);

    // 5. Minify if format is UMD
    if (format === 'umd') {
      await runMinify({ bundleName, code });
    }
  }

  // 6. Generate Type Definitions (.d.ts)
  await generateDts(pkgName);
}

// --- MAIN EXECUTION (IIFE) ---
// Wrapped in async IIFE to use await at top level
(async () => {
  try {
    console.log(chalk.cyan('Starting build...'));

    // 1. Cleanup old folders
    // shell.rm('-rf', 'esm', 'dist');
    shell.rm('-rf', 'dist');

    // 2. Compile TypeScript
    const tscResult = shell.exec('tsc -p tsconfig.dist.json');
    if (tscResult.code !== 0) {
      throw new Error('TSC compilation failed');
    }

    // 3. Babel Transform (for ESM build)
    // const babelResult = shell.exec(`NODE_ENV=esm "${babelBin}" esm-temp --out-dir esm --ignore "esm-temp/types.js"`);

    // if (babelResult.code !== 0) {
    //   throw new Error('Babel transformation failed. Ensure @babel/cli is installed.');
    // }

    // 4. Run Formily Build (Rollup)
    await build('formily');

    // 5. Cleanup temp files
    shell.rm('-rf', 'esm-temp');

    console.log(chalk.cyan('Build completed successfully!'));
  } catch (error) {
    console.error(chalk.red('Build failed:'));
    console.error(error);
    process.exit(1);
  }
})();
