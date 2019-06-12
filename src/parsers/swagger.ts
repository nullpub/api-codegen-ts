import { TaskEither, taskify } from 'fp-ts/lib/TaskEither';
import * as converter from 'swagger2openapi';

import { MonadApp, Parser } from '../core';
import { OpenAPIObject } from '../types/openapi-3.0.2';
import { getSource, parseSource, safeJsonParse } from './openapi';

const convertTask = taskify(converter.convertObj);

/**
 * The swagger parser is responsible for reading the designated src
 * file, validating it, and transforming it into an OpenApiObject
 */

type App<I> = TaskEither<string, I>;

function convertSpec(M: MonadApp<OpenAPIObject>, spec: unknown): App<unknown> {
  return M.log('Converting Swagger 2.0 to OpenApi 3.0.2')
    .chain(() =>
      convertTask(spec, {}).mapLeft(
        () => 'Failed to convert Swagger 2.0.0 to OpenApi 3.0.2'
      )
    )
    .map(({ openapi }) => openapi);
}

function main(M: MonadApp<OpenAPIObject>): App<OpenAPIObject> {
  return M.log('Parser: Swagger 2.0.0')
    .chain(() => getSource(M))
    .chain(content => safeJsonParse(content, M.src))
    .chain(content => convertSpec(M, content))
    .chain(content => parseSource(M, content));
}

export const swaggerParser: Parser<OpenAPIObject> = main;
