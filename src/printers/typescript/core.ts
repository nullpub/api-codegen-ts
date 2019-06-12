import { taskEither } from 'fp-ts/lib/TaskEither';

import { Printer } from '../../core';
import { OpenAPIObject } from '../../types/openapi-3.0.2';

/**
 * The typescript printer is responsible for:
 * - Receiving an OpenApiObject
 * - Building typescript controllers, definitions, and utilities
 * - Resolving dependencies between the objects
 * - Creating the file strings to be created
 * - Returning an array of Files for core to write
 *
 * Future features
 * - Build lenses
 * - Run typecheck against generated files (if possible)
 */

export const typescriptPrinter: Printer<OpenAPIObject> = (_, i) => {
  return taskEither.of([
    {
      path: './local/dist/test',
      content: `Hello World ${new Date().toLocaleString()}\n\n${JSON.stringify(
        i
      )}`,
      overwrite: true,
    },
  ]);
};
