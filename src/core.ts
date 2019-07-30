import { createPatch } from 'diff';
import { sequenceT } from 'fp-ts/lib/Apply';
import { array } from 'fp-ts/lib/Array';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as path from 'path';

/**
 * The core of api-codegen-ts is responsible for:
 * - Validating configuration
 * - Reading the source file to a string
 * - Chaining the parser and the printer
 * - Writing result files to filesystem
 *   - Overwriting when a file exists and overwrite = true
 *   - Outputting a diff when a file exists and overwrite = false
 */

export type App<T> = TE.TaskEither<string | Error, T>;

// Make all properties in T required and make provided properties not required
export type RequiredSplit<T, E extends keyof T> = Required<
  Pick<T, Exclude<keyof T, E>>
> &
  Partial<Pick<T, E>>;

interface PackageJSON {
  name: string;
  apiCodegen?: {
    src?: string;
    dst?: string;
    overwrite?: boolean;
  };
}

export interface File {
  path: string;
  content: string;
  overwrite: boolean;
}
export const toFile = (
  path: string,
  content: string,
  overwrite: boolean = false
): File => ({
  path,
  content,
  overwrite,
});

export interface PackageConfig {
  name: string;
  src: O.Option<string>;
  dst: O.Option<string>;
  overwrite: boolean;
}

export interface FileSystem {
  getFilenames: (pattern: string) => App<Array<string>>;
  makeDirectory: (path: string) => App<void>;
  readFile: (path: string) => App<string>;
  writeFile: (path: string, content: string) => App<void>;
  existsFile: (path: string) => App<boolean>;
  clean: (pattern: string) => App<void>;
}

export interface Log {
  log: (message: string) => App<void>;
}

export type Parser<I> = (M: MonadApp<I>, F: File) => App<I>;
export type Printer<I> = (M: MonadApp<I>, I: I) => App<File[]>;

export interface Config<I> extends FileSystem, Log {
  src: string;
  dst: string;
  overwrite: boolean;
  parser: Parser<I>;
  printer: Printer<I>;
}

export type PartialConfig<I> = RequiredSplit<
  Config<I>,
  'src' | 'dst' | 'overwrite'
>;

export type MonadApp<I = unknown> = Required<Config<I>>;

export type PartialMonadApp<I = unknown> = Config<I>;

// TODO pull out this generic, JSON.parse returns unknown
function safeJsonParse<I>(s: string): App<I> {
  return TE.tryCatch(
    () => Promise.resolve(JSON.parse(s) as I),
    e => `Error parsing package.json ${e}`
  );
}

function getPackageConfig<I>(M: PartialConfig<I>): App<PackageConfig> {
  const log = logFactory(M);
  return pipe(
    M.readFile(path.join(process.cwd(), 'package.json')),
    TE.chain(content => safeJsonParse<PackageJSON>(content)),
    TE.chain(json => {
      const name = json.name;
      const apiCodegen = O.fromNullable(json.apiCodegen);
      const src = pipe(
        apiCodegen,
        O.mapNullable(o => o.src)
      );
      const dst = pipe(
        apiCodegen,
        O.mapNullable(o => o.dst)
      );
      const overwrite = pipe(
        apiCodegen,
        O.mapNullable(o => o.overwrite),
        O.getOrElse(() => false)
      );

      if (O.isNone(src)) {
        return TE.left(`Source path is required.`);
      }

      if (O.isNone(dst)) {
        return TE.left('Destination path is required');
      }

      return pipe(
        M.log(`Project name detected: ${name}`),
        TE.chain(log(`Source file: ${src.value}`)),
        TE.chain(log(`Destination: ${dst.value}`)),
        TE.chain(log(`Overwrite files: ${String(overwrite)}`)),
        TE.map(() => ({
          name,
          src,
          dst,
          overwrite,
        }))
      );
    })
  );
}

function assembleConfig<I>(
  config: PartialConfig<I>,
  pConfig: PackageConfig
): App<MonadApp<I>> {
  const src = pipe(
    O.fromNullable(config.src),
    O.alt(() => pConfig.src)
  );
  const dst = pipe(
    O.fromNullable(config.dst),
    O.alt(() => pConfig.dst)
  );
  const overwrite = pipe(
    O.fromNullable(config.overwrite),
    O.getOrElse(() => pConfig.overwrite)
  );
  return pipe(
    sequenceT(O.option)(src, dst),
    O.fold(
      () => TE.left('No src or dst in package.json or config.'),
      ([src, dst]) => TE.right({ ...config, src, dst, overwrite })
    )
  );
}

function diffFile(M: FileSystem & Log, file: File): App<string> {
  return pipe(
    M.readFile(file.path),
    TE.map(oldContent => createPatch(file.path, oldContent, file.content))
  );
}

// TODO Check for file equality and only diff if file strings are different
function writeFile<T>(M: Config<T>, file: File): App<void> {
  return pipe(
    M.existsFile(file.path),
    TE.chain(exists => {
      const overwrite = file.overwrite || M.overwrite;

      if (exists && !overwrite) {
        return pipe(
          M.log(
            `File ${file.path} already exists, skipping creation, following is the patch`
          ),
          TE.chain(() => diffFile(M, file)),
          TE.chain(diff => M.log(diff))
        );
      }

      const message = exists
        ? `Overwriting file ${file.path}`
        : `Writing file ${file.path}`;

      return pipe(
        M.log(message),
        TE.chain(() => M.writeFile(file.path, file.content))
      );
    })
  );
}

function writeFiles<T>(M: Config<T>, files: File[]): App<void> {
  return pipe(
    M.makeDirectory(M.dst),
    TE.chain(() =>
      array.sequence(TE.taskEither)(files.map(file => writeFile(M, file)))
    ),
    TE.map(() => undefined)
  );
}

function getSource(M: MonadApp<any>): App<File> {
  return pipe(
    M.existsFile(M.src),
    TE.chain(e => {
      if (e) {
        return pipe(
          M.log(`Reading source: ${M.src}`),
          TE.chain(() => M.readFile(M.src)),
          TE.map(content => toFile(M.src, content, true))
        );
      }
      return TE.left(`Source does not exist ${M.src}`);
    })
  );
}

function program<I>(M: Config<I>): App<void> {
  const log = logFactory(M);

  const source = pipe(
    M.log('Started reading source'),
    TE.chain(() => getSource(M)),
    TE.chain(log('Finished reading source'))
  );
  const parse = pipe(
    source,
    TE.chain(log('Started parsing')),
    TE.chain(file => M.parser(M, file)),
    TE.chain(log('Finished parsing'))
  );
  const print = pipe(
    parse,
    TE.chain(log('Started printing')),
    TE.chain(i => M.printer(M, i)),
    TE.chain(log('Finished printing'))
  );
  const write = pipe(
    print,
    TE.chain(log('Started writing files')),
    TE.chain(files => writeFiles(M, files)),
    TE.chain(log('Finished writing files'))
  );

  return write;
}

// Utility function for logging between bind(chain)
export const logFactory = (M: Log) => (message: string) => <P>(p: P): App<P> =>
  pipe(
    M.log(message),
    TE.map(() => p)
  );

export function main<I>(config: PartialConfig<I>): App<void> {
  return pipe(
    getPackageConfig(config),
    TE.chain(p => assembleConfig(config, p)),
    TE.chain(program)
  );
}
