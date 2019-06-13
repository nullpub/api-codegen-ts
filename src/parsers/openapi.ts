import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import { Errors } from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';

import { App, File, MonadApp, Parser } from '../core';
import { OpenAPIObject, OpenAPIObjectIO } from '../types/openapi-3.0.2';

/**
 * The openapi parser is responsible for reading the designated src
 * file, validating it, and transforming it into an OpenApiObject
 */

export function safeJsonParse<I>(s: string, path: string): App<I> {
  return TE.tryCatch(
    () => Promise.resolve(JSON.parse(s) as I),
    e => `Error parsing ${path} ${e}`
  );
}

export function writeParseLog(M: MonadApp<OpenAPIObject>, errors: Errors) {
  const logName = `parse-errors.log`;
  return pipe(
    M.writeFile(logName, PathReporter.report(E.left(errors)).join('\r\n\r\n')),
    TE.chain(() =>
      TE.left<string | Error>(
        `Source validation failed. See errors in ${logName}`
      )
    )
  );
}

export function parseSource(
  M: MonadApp<OpenAPIObject>,
  source: unknown
): App<OpenAPIObject> {
  const decoded = OpenAPIObjectIO.decode(source);
  return pipe(
    decoded,
    E.fold(
      errors => writeParseLog(M, errors),
      api =>
        pipe(
          M.log(`Validated source: ${M.src}`),
          TE.map(() => api)
        )
    )
  );
}

function main(M: MonadApp<OpenAPIObject>, F: File): App<OpenAPIObject> {
  return pipe(
    M.log('Parser: OpenApi 3.0.2'),
    TE.map(() => F.content),
    TE.chain(content => safeJsonParse(content, M.src)),
    TE.chain(content => parseSource(M, content))
  );
}

export const openapiParser: Parser<OpenAPIObject> = main;
