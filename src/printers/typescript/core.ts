import { array } from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { format, Options } from 'prettier';

import { App, Config, File, logFactory, Printer } from '../../core';
import { OpenAPIObject } from '../../types/openapi-3.0.2';
import { buildControllers } from './controller';
import { buildModels } from './schema';

/**
 * The typescript printer is responsible for:
 * - Receiving an OpenApiObject
 * - Building typescript controllers and models
 * - Resolving dependencies between the objects
 * - Creating the file strings to be created
 * - Running prettier on the resultant typescript files
 * - Returning an array of files for core to write
 *
 * Future features
 * - Build lenses
 * - Run typecheck against generated files (if possible) - DONE-ish
 */

export type Conf = Config<OpenAPIObject>;

export const modelFile = 'models.ts';
export const modelImport = './models';
export const controllerFile = 'controllers.ts';
export const controllerImport = './controllers';

const prettierConfig: Options = {
  parser: 'typescript',
  trailingComma: 'es5',
  singleQuote: true,
};

const formatFile = ({ path, content, overwrite }: File): App<File> =>
  TE.tryCatch(
    () =>
      Promise.resolve({
        path,
        overwrite,
        content: format(content, prettierConfig),
      }),
    _ => `Failed while running prettier on ${path}`
  );

const formatFiles = (files: File[]): App<File[]> =>
  array.traverse(TE.taskEither)(files, formatFile);

export const typescriptPrinter: Printer<OpenAPIObject> = (C, spec) => {
  const log = logFactory(C);

  const build = pipe(
    C.log('Started building library'),
    TE.chain(() => buildControllers(C, spec)),
    TE.map(files =>
      files.concat(buildModels(C, modelFile, spec.components.schemas))
    ),
    TE.chain(log('Finished building library'))
  );
  const prettier = pipe(
    build,
    TE.chain(log('Started running prettier on library')),
    TE.chain(formatFiles),
    TE.chain(log('Finished running prettier on library'))
  );
  return prettier;
};
