import { flatten } from 'fp-ts/lib/Array';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as t from 'io-ts-codegen';
import * as path from 'path';

import { App, Config, File, toFile } from '../../core';
import {
  OpenAPIObject,
  OperationObject,
  ParameterObject,
  PathItemObject,
  PathsObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  ResponsesObject,
  SchemaObject,
} from '../../types/openapi-3.0.2';
import { index } from './INDEX_SOURCE';
import { isRef, refName } from './ref';
import { JSONSchema, to } from './schema';
import { utilities } from './UTILITIES_SOURCE';

type Method =
  | 'get'
  | 'put'
  | 'post'
  | 'delete'
  | 'options'
  | 'head'
  | 'patch'
  | 'trace';
const VERBS: Method[] = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
];

interface Operation {
  name: string;
  method: Method;
  response: t.TypeReference;
  key: string;
  path?: t.TypeReference;
  query?: t.TypeReference;
  requestBody?: t.TypeReference;
  description?: string;
}

const range = (count: number, start: number = 0): number[] =>
  Array.from({ length: count }, (_, i) => i + start);

const imports = `
import * as t from 'io-ts';

import * as m from './models';
import * as u from './utilities';
`;

const toCustomImportCombinator = (
  type: t.CustomCombinator,
  prefix = 'm.'
): t.CustomCombinator =>
  t.customCombinator(
    prefix + type.static,
    prefix + type.runtime,
    type.dependencies
  );

export function toRefCombinator(
  schema: ReferenceObject
): t.CustomCombinator | t.UnknownType {
  const name = refName(schema.$ref);
  if (name.length === 0) {
    return t.unknownType;
  }
  return t.customCombinator(name, name, [name]);
}

const toReferenceWrapper = (schema: JSONSchema) => {
  if (isRef(schema)) {
    const ref = toRefCombinator(schema);
    if (ref.kind === 'CustomCombinator') {
      return toCustomImportCombinator(ref);
    }
    return ref;
  }

  return to(schema, toReferenceWrapper);
};

const toPath = (
  params: ParameterObject[] = []
): t.TypeReference | undefined => {
  const pathParams = params.filter(p => p.in === 'path');
  if (pathParams.length === 0) {
    return;
  }

  const properties = pathParams.map(param =>
    t.property(
      param.name,
      param.schema ? toReferenceWrapper(param.schema) : t.stringType,
      !param.required,
      param.description
    )
  );

  return t.typeCombinator(properties);
};

const toQuery = (
  params: ParameterObject[] = []
): t.TypeReference | undefined => {
  const pathParams = params.filter(p => p.in === 'query');
  if (pathParams.length === 0) {
    return;
  }

  const properties = pathParams.map(param =>
    t.property(
      param.name,
      param.schema ? toReferenceWrapper(param.schema) : t.stringType,
      !param.required,
      param.description
    )
  );
  return t.typeCombinator(properties);
};

const toRequestBody = (
  requestBody?: RequestBodyObject
): t.TypeReference | undefined => {
  const schema = pipe(
    O.fromNullable(requestBody),
    O.map(r => r.content),
    O.mapNullable(c => c['application/json']),
    O.mapNullable(o => o.schema),
    O.fold(() => undefined, toReferenceWrapper)
  );
  return schema;
};

const findSuccessResponse = (
  responses: ResponsesObject
): O.Option<SchemaObject | ReferenceObject> => {
  const goodCodes = range(99, 200);

  const codeResponse = pipe(
    O.fromNullable(goodCodes.find(c => responses[c])),
    O.mapNullable(c => responses[c])
  );

  const defaultResponse = O.fromNullable(responses['default']);

  const response = pipe(
    codeResponse,
    O.alt(() => defaultResponse),
    O.filter((_: any): _ is ResponseObject => true),
    O.mapNullable(r => r.content),
    O.mapNullable(c => c['application/json']),
    O.mapNullable(m => m.schema)
  );

  return response;
};

const toResponse = (responses: ResponsesObject): t.TypeReference =>
  O.fold(() => t.unknownType, toReferenceWrapper)(
    findSuccessResponse(responses)
  );

const toOperation = (
  C: Config<OpenAPIObject>,
  key: string,
  method: Method,
  operation: OperationObject,
  parameters: ParameterObject[] = []
): Operation => {
  return {
    method,
    name: operation.operationId || key, // TODO This is probably wrong
    description: operation.description || operation.summary,
    key,
    path: toPath(parameters),
    query: toQuery(parameters),
    requestBody: isRef(operation.requestBody)
      ? toReferenceWrapper(operation.requestBody)
      : toRequestBody(operation.requestBody),
    response: toResponse(operation.responses),
  };
};

const fromPath = (C: Config<OpenAPIObject>, key: string) => (
  p: PathItemObject,
  m: Method
): O.Option<Operation> =>
  pipe(
    O.fromNullable(p[m]),
    O.map(o =>
      toOperation(C, key, m, o, [
        ...(p.parameters || []),
        ...(o.parameters || []),
      ])
    )
  );

const fromPaths = (
  C: Config<OpenAPIObject>,
  pathsRecord: PathsObject
): Operation[] => {
  const paths = Object.keys(pathsRecord).map(
    key => [key, pathsRecord[key]] as [string, PathItemObject]
  );
  const operations = paths.map(([key, path]) => {
    const operationF = fromPath(C, key);
    return VERBS.map(v => operationF(path, v));
  });
  return flatten(operations)
    .filter(O.isSome) // TODO Fix type
    .map(o => o.value);
};

const toRequestTypeDeclaration = (
  operation: Operation
): t.TypeDeclaration | undefined => {
  let requestProperties: t.Property[] = [];
  if (operation.path) {
    requestProperties.push(t.property('path', operation.path));
  }
  if (operation.query) {
    requestProperties.push(t.property('query', operation.query));
  }
  if (operation.requestBody) {
    requestProperties.push(t.property('body', operation.requestBody));
  }

  if (requestProperties.length === 0) {
    return;
  }

  return t.typeDeclaration(
    operation.name + 'Request',
    t.typeCombinator(requestProperties),
    true
  );
};
const toResponseTypeDeclaration = (operation: Operation): t.TypeDeclaration => {
  return t.typeDeclaration(
    operation.name + 'Response',
    operation.response,
    true
  );
};

const getFile = (
  C: Config<OpenAPIObject>,
  name: string,
  content: string
): File => toFile(path.join(C.dst, name), content);

const printControllerReader = (
  { name, method, key }: Operation,
  requestType?: t.TypeDeclaration
): string => {
  if (requestType) {
    return `export const ${name}Reader = u.controllerFactory<${requestType.name}, ${name}Response>(${name}Response, '${method}', '${key}')`;
  }
  return `export const ${name}Reader = u.requestlessControllerFactory<${name}Response>(${name}Response, '${method}', '${key}')`;
};

const printOperationDescription = (operation: Operation): string => {
  let description = `/* ${operation.name}`;
  description += operation.description ? `: ${operation.description}` : '';
  description += ' */';
  return description;
};

const printOperation = (operation: Operation): string => {
  const requestTypeDeclaration = toRequestTypeDeclaration(operation);
  const requestStatic = requestTypeDeclaration
    ? t.printStatic(requestTypeDeclaration)
    : '';
  const responseTypeDeclaration = toResponseTypeDeclaration(operation);
  const responseStatic = t.printStatic(responseTypeDeclaration);
  const responseRuntime = t.printRuntime(responseTypeDeclaration);
  const operationDescription = printOperationDescription(operation);

  let output = requestStatic.length > 0 ? [requestStatic] : [];
  output.push(responseStatic);
  output.push(responseRuntime);
  output.push('');
  output.push(operationDescription);
  output.push(printControllerReader(operation, requestTypeDeclaration));

  return output.join('\n');
};

const printControllers = (operations: Operation[]): string => {
  let output = '';
  output += `${imports}\n\n`;
  output += `${operations.map(printOperation).join('\n\n')}`;

  return output;
};

export function buildControllers(
  C: Config<OpenAPIObject>,
  spec: OpenAPIObject
): App<File[]> {
  return TE.right([
    getFile(C, 'utilities.ts', utilities),
    getFile(C, 'index.ts', index),
    getFile(C, 'controllers.ts', printControllers(fromPaths(C, spec.paths))),
  ]);
}
