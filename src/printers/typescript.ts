import { taskEither } from 'fp-ts/lib/TaskEither';

import { Printer } from '../core';
import { OpenAPIObject } from '../types/openapi-3.0.2';

export const typescriptPrinter: Printer<OpenAPIObject> = (M, i) => {
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
