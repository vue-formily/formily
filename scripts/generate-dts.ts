import ts from 'typescript';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { rollup, RollupOptions } from 'rollup';
import dts from 'rollup-plugin-dts';
import { pkgNameMap } from './rollup.config';

const declarationRoot = path.resolve('dist/types');
const srcEntry = path.resolve('src/index.ts');
const tsconfigPath = path.resolve('tsconfig.json');

async function bundleDts(pkgName: string) {
  let entry = path.join(declarationRoot, 'index.d.ts');

  if (!fs.existsSync(entry)) {
    entry = path.join(declarationRoot, 'src', 'index.d.ts');
  }

  if (!fs.existsSync(entry)) {
    entry = path.join(declarationRoot, 'index.d.ts');
    if (!fs.existsSync(entry)) {
      console.warn(chalk.yellow('Cannot find index.d.ts to bundle. Skipping bundle step.'));
      return;
    }
  }

  const config: RollupOptions = {
    input: entry,
    external: ['vue', '@vue-formily/util'],
    output: {
      file: `dist/${pkgNameMap[pkgName]}.d.ts`,
      format: 'es'
    },
    plugins: [
      dts({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['dist/types/*']
          }
        }
      })
    ]
  };

  const bundle = await rollup(config);
  if (config.output) {
    await bundle.write(config.output as any);
  }

  await fs.remove(declarationRoot);
  console.log(chalk.cyan(`Bundled ${pkgNameMap[pkgName]} Declaration Files...`));
}

export async function generateDts(pkgName: string) {
  console.log(chalk.cyan(`Generating Declaration Files for ${pkgNameMap[pkgName]} ...`));

  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

  if (configFile.error) {
    throw new Error(configFile.error.messageText as string);
  }

  const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsconfigPath));

  const options: ts.CompilerOptions = {
    ...parsedConfig.options,
    declaration: true,
    declarationMap: false,
    emitDeclarationOnly: true,
    declarationDir: declarationRoot,
    outDir: declarationRoot
  };

  const host = ts.createCompilerHost(options);
  const createdFiles: Record<string, string> = {};

  host.writeFile = (fileName, contents) => {
    createdFiles[fileName] = contents;
  };

  const program = ts.createProgram([srcEntry], options, host);
  program.emit();

  for (const [fileName, contents] of Object.entries(createdFiles)) {
    fs.outputFileSync(path.resolve(fileName), contents);
  }

  await bundleDts(pkgName, options);
}
