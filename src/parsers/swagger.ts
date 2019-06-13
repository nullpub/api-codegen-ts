import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as converter from 'swagger2openapi';

import { App, File, Log, MonadApp, Parser } from '../core';
import { OpenAPIObject } from '../types/openapi-3.0.2';
import { parseSource, safeJsonParse } from './openapi';

const convertTask = TE.taskify(converter.convertObj);

/**
 * The swagger parser is responsible parsing the supplied file,
 * converting it to the openapi 3.0.2 spec, and validating the
 * converted spec, and resulting the returned
 *
 */

function convertSpec(M: Log, spec: unknown): App<unknown> {
  return pipe(
    M.log('Converting Swagger 2.0 to OpenApi 3.0.2'),
    TE.chain(() => convertTask(spec, {}) as TE.TaskEither<string | Error, any>), // UGGGGHHHH
    TE.map(({ openapi }) => openapi)
  );
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
