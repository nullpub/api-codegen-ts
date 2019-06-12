import { log } from 'fp-ts/lib/Console';
import { IO } from 'fp-ts/lib/IO';
import { fromIO, Task, task } from 'fp-ts/lib/Task';
import * as fs from 'fs-extra';
import glob = require('glob');
import rimraf = require('rimraf');

import { Config, main, Parser, Printer } from './core';
import { openApiParser } from './parsers/openapi';
import { typescriptPrinter } from './printers/typescript';
import { OpenAPIObject } from './types/openapi-3.0.2';

// Probably clean this up and think of a good reader pattern here.
const monadApp: Config<OpenAPIObject> = {
  // FileSystem
  getFilenames: (pattern: string) => fromIO(new IO(() => glob.sync(pattern))),
  readFile: (path: string) =>
    fromIO(new IO(() => fs.readFileSync(path, { encoding: 'utf8' }))),
  writeFile: (path: string, content: string) =>
    fromIO(new IO(() => fs.outputFileSync(path, content))),
  existsFile: (path: string) => fromIO(new IO(() => fs.existsSync(path))),
  clean: (pattern: string) => fromIO(new IO(() => rimraf.sync(pattern))),

  // Log
  log: (message: string) => fromIO(log(message)),

  // Other
  parser: openApiParser,
  printer: typescriptPrinter,
};

const exit = (code: 0 | 1) => new IO(() => process.exit(code));

function onLeft(e: string): Task<void> {
  return fromIO(log(e).chain(() => exit(1)));
}

function onRight(): Task<void> {
  return task.of(undefined);
}

export { Config, Parser, Printer, main };

export const defaultApp = main(monadApp).foldTask(onLeft, onRight);
