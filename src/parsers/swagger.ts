import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as path from 'path';
import * as converter from 'swagger2openapi';

import { App, File, MonadApp, Parser } from '../core';
import { OpenAPIObject } from '../types/openapi-3.0.2';
import { parseSource, safeJsonParse } from './openapi';

const convertTask = TE.taskify(converter.convertObj);

/**
 * The swagger parser is responsible parsing the supplied file,
 * converting it to the openapi 3.0.2 spec, and validating the
 * converted spec, and resulting the returned
 *
 */

function convertSpec(M: MonadApp<OpenAPIObject>, spec: unknown): App<unknown> {
  const convertedFileName = `CONVERTED-${path.basename(M.src)}`;
  const convertedFilePath = path.join(path.dirname(M.src), convertedFileName);
  const openapiTE = pipe(
    M.log('Converting Swagger 2.0 to OpenApi 3.0.2'),
    TE.chain(() => convertTask(spec, {}) as TE.TaskEither<string | Error, any>), // UGGGGHHHH
    TE.map(({ openapi }) => openapi as unknown)
  );
  const writeConversionFileTE = pipe(
    openapiTE,
    TE.chain(openapi =>
      M.writeFile(convertedFilePath, JSON.stringify(openapi))
    ),
    TE.chain(() => openapiTE)
  );
  return writeConversionFileTE;
}

function main(M: MonadApp<OpenAPIObject>, F: File): App<OpenAPIObject> {
  return pipe(
    M.log('Using parser: Swagger 2.0'),
    TE.chain(() => safeJsonParse(F.content, M.src)),
    TE.chain(content => convertSpec(M, content)),
    TE.chain(content => parseSource(M, content))
  );
}

export const swaggerParser: Parser<OpenAPIObject> = main;
