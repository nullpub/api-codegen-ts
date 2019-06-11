import { fromLeft, TaskEither, tryCatch } from 'fp-ts/lib/TaskEither';
import { Errors } from 'io-ts';
import { formatValidationError } from 'io-ts-reporters';

import { MonadApp, Parser } from '../core';
import { OpenAPIObject, OpenAPIObjectIO } from '../types/openapi-3.0.2';

type App<I> = TaskEither<string, I>;
type M = MonadApp<OpenAPIObject>;

function safeJsonParse<I>(s: string, path: string): TaskEither<string, I> {
  return tryCatch(
    () => Promise.resolve(JSON.parse(s) as I),
    e => `Error parsing ${path} ${e}`
  );
}

function getSource(M: M): App<string> {
  return M.fromTask<string, boolean>(M.existsFile(M.src)).chain(e => {
    if (e) {
      const fileM = M.log(`Reading ${M.src}`).chain(() => M.readFile(M.src));
      return M.fromTask(fileM);
    }
    return fromLeft<string, string>(`Source does not exist ${M.src}`);
  });
}

function writeParseLog(M: M, errors: Errors): App<OpenAPIObject> {
  const logName = `parse-errors.log`;
  return M.fromTask<string, void>(
    M.writeFile(
      logName,
      errors.map(x => formatValidationError(x).getOrElse('')).join('\r\n\r\n')
    )
  ).chain(() => fromLeft(`Source validation failed. See errors in ${logName}`));
}

function parseSource(M: M, source: unknown): App<OpenAPIObject> {
  const decoded = OpenAPIObjectIO.decode(source);
  return decoded.fold(errors => writeParseLog(M, errors), api => M.of(api));
}

function main(M: M): App<OpenAPIObject> {
  return getSource(M)
    .chain(content => safeJsonParse(content, M.src))
    .chain(content => parseSource(M, content));
}

export const openApiParser: Parser<OpenAPIObject> = main;
