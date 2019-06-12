import { sequenceT } from 'fp-ts/lib/Apply';
import { array } from 'fp-ts/lib/Array';
import { Either, left, right } from 'fp-ts/lib/Either';
import { fromNullable, Option, option } from 'fp-ts/lib/Option';
import { fromEither, fromLeft, TaskEither, taskEither, tryCatch } from 'fp-ts/lib/TaskEither';
import * as path from 'path';

export type PartialExcept<T, E extends keyof T> = Partial<T> & Pick<T, E>;

interface PackageJSON {
  name: string;
  apiCodegen?: {
    src?: string;
    dst?: string;
  };
}

export interface File {
  path: string;
  content: string;
  overwrite: boolean;
}

export interface PackageConfig {
  name: string;
  src: Option<string>;
  dst: Option<string>;
}

export interface FileSystem {
  getFilenames: (pattern: string) => TaskEither<string, Array<string>>;
  readFile: (path: string) => TaskEither<string, string>;
  writeFile: (path: string, content: string) => TaskEither<string, void>;
  existsFile: (path: string) => TaskEither<string, boolean>;
  clean: (pattern: string) => TaskEither<string, void>;
}

export interface Log {
  log: (message: string) => TaskEither<string, void>;
}

export type Parser<I> = (M: MonadApp<I>) => TaskEither<string, I>;
export type Printer<I> = (M: MonadApp<I>, I: I) => TaskEither<string, File[]>;

export interface Config<I> extends FileSystem, Log {
  src?: string;
  dst?: string;
  parser: Parser<I>;
  printer: Printer<I>;
}

export type MonadApp<I = unknown> = Required<Config<I>>;

export type PartialMonadApp<I = unknown> = Config<I>;

function safeJsonParse<I>(s: string): TaskEither<string, I> {
  return tryCatch(
    () => Promise.resolve(JSON.parse(s) as I),
    e => `Error parsing package.json ${e}`
  );
}

function getPackageConfig<I>(M: Config<I>): TaskEither<string, PackageConfig> {
  return M.readFile(path.join(process.cwd(), 'package.json'))
    .chain(content => safeJsonParse<PackageJSON>(content))
    .chain(json => {
      const name = json.name;
      const src = fromNullable(json.apiCodegen).chain(o => fromNullable(o.src));
      const dst = fromNullable(json.apiCodegen).chain(o => fromNullable(o.dst));

      if (src.isNone()) {
        return fromLeft<string, PackageConfig>(`Source path is required.`);
      }

      if (dst.isNone()) {
        return fromLeft<string, PackageConfig>('Destination path is required');
      }

      return M.log(`Project name detected: ${name}`).map(() => ({
        name,
        src,
        dst,
      }));
    });
}

function assembleMonad<I>(
  config: Config<I>,
  pConfig: PackageConfig
): TaskEither<string, MonadApp<I>> {
  const src = fromNullable(config.src).alt(pConfig.src);
  const dst = fromNullable(config.dst).alt(pConfig.dst);
  const monad: Either<string, MonadApp<I>> = sequenceT(option)(src, dst)
    .map(([src, dst]) => ({ src, dst }))
    .fold(left('No src or dst in package.json or config.'), ps =>
      right(Object.assign({}, config, ps, taskEither) as MonadApp<I>)
    );
  return fromEither(monad);
}

function writeFile<I>(M: MonadApp<I>, file: File): TaskEither<string, void> {
  const writeFile = M.writeFile(file.path, file.content);
  return M.existsFile(file.path).foldTaskEither(
    str => fromLeft(str),
    exists => {
      if (exists) {
        if (file.overwrite) {
          return M.log(`Overwriting file ${file.path}`).chain(() => writeFile);
        }
        return M.log(`File ${file.path} already exists, skipping creation`);
      }
      return M.log(`Writing file ${file.path}`).chain(() => writeFile);
    }
  );
}

function writeFiles<I>(
  M: MonadApp<I>,
  files: File[]
): TaskEither<string, void> {
  return array
    .traverse(taskEither)(files, file => writeFile(M, file))
    .map(() => undefined);
}

export function log<I>(M: MonadApp<I>, message: string) {
  return function<P>(pass: P): TaskEither<string, P> {
    return M.log(message).map(() => pass);
  };
}

export function main<I>(config: Config<I>): TaskEither<string, void> {
  return getPackageConfig(config)
    .chain(p => assembleMonad(config, p))
    .chain(M =>
      M.parser(M)
        .chain(log(M, 'Parsing done'))
        .chain(i => M.printer(M, i))
        .chain(files => writeFiles(M, files))
    );
}
