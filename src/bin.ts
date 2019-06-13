import { log } from 'fp-ts/lib/Console';
import * as IO from 'fp-ts/lib/IO';
import { pipe } from 'fp-ts/lib/pipeable';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import * as fs from 'fs';
import glob = require('glob');
import rimraf = require('rimraf');

import { main, PartialConfig } from './core';
import { swaggerParser } from './parsers/swagger';
import { typescriptPrinter } from './printers/typescript';
import { OpenAPIObject } from './types/openapi-3.0.2';

const readFile = (
  path: string,
  cb: (err: NodeJS.ErrnoException | null, data: string) => void
) => fs.readFile(path, { encoding: 'utf-8' }, cb);
const makeDirectory = (
  path: string,
  cb: (err: NodeJS.ErrnoException | null) => void
) => fs.mkdir(path, { recursive: true }, cb);

// Probably clean this up and think of a good reader pattern here.
const config: PartialConfig<OpenAPIObject> = {
  // FileSystem
  getFilenames: TE.taskify(glob),
  readFile: (path: string) =>
    pipe(
      TE.taskify(readFile)(path),
      TE.mapLeft(e => `Error reading file\n${e}`)
    ),
  makeDirectory: (path: string) =>
    pipe(
      TE.taskify(makeDirectory)(path),
      TE.bimap(e => `Error creating directory\n${e}`, () => undefined)
    ),
  writeFile: (path: string, content: string) =>
    pipe(
      TE.taskify(fs.writeFile)(path, content),
      TE.bimap(e => `Error writing file ${path}\n${e}}`, () => undefined)
    ),
  existsFile: (path: string) =>
    pipe(
      TE.swap(TE.taskify(fs.exists)(path)),
      TE.mapLeft(() => '')
    ),
  clean: (pattern: string) => TE.rightIO(IO.of(rimraf.sync(pattern))),

  // Log
  log: (message: string) => TE.rightIO(log(message)),

  // App
  parser: swaggerParser,
  printer: typescriptPrinter,
};

const exit = (code: 0 | 1) => IO.of(process.exit(code));

function onLeft(e: string | Error): T.Task<void> {
  return pipe(
    T.fromIO(log(e)),
    T.chain(() => exit(1))
  );
}

function onRight(): T.Task<void> {
  return T.of(undefined);
}

const program = pipe(
  main(config),
  TE.fold(onLeft, onRight)
);

program().catch(error => console.log('Unknown Error', error));
