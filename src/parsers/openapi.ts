import { fromLeft, TaskEither, tryCatch } from 'fp-ts/lib/TaskEither';
import { Errors } from 'io-ts';
import { formatValidationError } from 'io-ts-reporters';

import { MonadApp, Parser } from '../core';
import { OpenAPIObject, OpenAPIObjectIO } from '../types/openapi-3.0.2';

/**
 * The openapi parser is responsible for reading the designated src
 * file, validating it, and transforming it into an OpenApiObject
 */

type App<I> = TaskEither<string, I>;

export function safeJsonParse<I>(
  s: string,
  path: string
): TaskEither<string, I> {
  return tryCatch(
    () => Promise.resolve(JSON.parse(s) as I),
    e => `Error parsing ${path} ${e}`
  );
}

export function getSource(M: MonadApp<OpenAPIObject>): App<string> {
  return M.existsFile(M.src).chain(e => {
    if (e) {
      return M.log(`Reading source: ${M.src}`).chain(() => M.readFile(M.src));
    }
    return fromLeft<string, string>(`Source does not exist ${M.src}`);
  });
}

export function writeParseLog(
  M: MonadApp<OpenAPIObject>,
  errors: Errors
): App<OpenAPIObject> {
  const logName = `parse-errors.log`;
  return M.writeFile(
    logName,
    errors.map(x => formatValidationError(x).getOrElse('')).join('\r\n\r\n')
  ).chain(() => fromLeft(`Source validation failed. See errors in ${logName}`));
}

export function parseSource(
  M: MonadApp<OpenAPIObject>,
  source: unknown
): App<OpenAPIObject> {
  const decoded = OpenAPIObjectIO.decode(source);
  return decoded.fold(
    errors => writeParseLog(M, errors),
    api => M.log(`Validated source: ${M.src}`).map(() => api)
  );
}

function main(M: MonadApp<OpenAPIObject>): App<OpenAPIObject> {
  return M.log('Parser: OpenApi 3.0.2')
    .chain(() => getSource(M))
    .chain(content => safeJsonParse(content, M.src))
    .chain(content => parseSource(M, content));
}

export const openapiParser: Parser<OpenAPIObject> = main;
