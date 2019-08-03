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
import { printActionsFile } from './actions';
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

export interface Operation {
  name: string;
  method: Method;
  request?: t.TypeReference;
  requestDeclaration?: t.TypeDeclaration;
  response: t.TypeReference;
  responseDeclaration: t.TypeDeclaration;
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

const sanitizeName = (name: string) => name.replace(/[\W_]+/g, '_');

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
      sanitizeName(param.name),
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
      sanitizeName(param.name),
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
    O.chain(c =>
      pipe(
        O.fromNullable(c['application/json']),
        O.alt(() => O.fromNullable(c['*/*']))
      )
    ),
    O.mapNullable(m => m.schema)
  );

  return response;
};

const toResponseTypeReference = (responses: ResponsesObject): t.TypeReference =>
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
  const name = sanitizeName(
    operation.operationId || `${method}_${refName(key)}`
  );
  const path = toPath(parameters);
  const query = toQuery(parameters);
  const requestBody = isRef(operation.requestBody)
    ? toReferenceWrapper(operation.requestBody)
    : toRequestBody(operation.requestBody);
  const request = toRequestTypeReference(path, query, requestBody);
  const requestDeclaration = toTypeDeclaration(`${name}Req`, request);
  const response = toResponseTypeReference(operation.responses);
  const responseDeclaration = toTypeDeclaration(
    `${name}Res`,
    response
  ) as t.TypeDeclaration;

  return {
    method,
    name,
    description: operation.description || operation.summary,
    key,
    path,
    query,
    requestBody,
    request,
    requestDeclaration,
    response,
    responseDeclaration,
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

const toRequestTypeReference = (
  path?: Operation['path'],
  query?: Operation['query'],
  requestBody?: Operation['requestBody']
): t.TypeReference | undefined => {
  let requestProperties: t.Property[] = [];
  if (path) {
    requestProperties.push(t.property('path', path));
  }
  if (query) {
    requestProperties.push(t.property('query', query));
  }
  if (requestBody) {
    requestProperties.push(t.property('body', requestBody));
  }

  if (requestProperties.length === 0) {
    return;
  }

  return t.typeCombinator(requestProperties);
};

const toTypeDeclaration = (
  name: string,
  typeReference?: t.TypeReference
): t.TypeDeclaration | undefined => {
  return typeReference
    ? t.typeDeclaration(name, typeReference, true)
    : undefined;
};

const getFile = (
  C: Config<OpenAPIObject>,
  name: string,
  content: string
): File => toFile(path.join(C.dst, name), content);

const printControllerFactory = ({
  name,
  method,
  key,
  responseDeclaration,
  requestDeclaration,
}: Operation): string => {
  const resName = responseDeclaration.name;
  if (requestDeclaration) {
    return `export const ${name}Factory = u.controllerFactory<${requestDeclaration.name}, ${resName}>(${resName}, '${method}', '${key}')`;
  }
  return `export const ${name}Factory = u.requestlessControllerFactory<${resName}>(${resName}, '${method}', '${key}')`;
};

const printOperationDescription = (operation: Operation): string => {
  let description = `/* ${operation.name}`;
  description += operation.description ? `: ${operation.description}` : '';
  description += ' */';
  return description;
};

const printOperation = (operation: Operation): string => {
  const requestStatic = operation.requestDeclaration
    ? t.printStatic(operation.requestDeclaration)
    : '';
  const responseStatic = t.printStatic(operation.responseDeclaration);
  const responseRuntime = t.printRuntime(operation.responseDeclaration);
  const operationDescription = printOperationDescription(operation);

  let output = requestStatic.length > 0 ? [requestStatic] : [];
  output.push(responseStatic);
  output.push(responseRuntime);
  output.push('');
  output.push(operationDescription);
  output.push(printControllerFactory(operation));

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
  const operations = fromPaths(C, spec.paths);
  return TE.right([
    getFile(C, 'utilities.ts', utilities),
    getFile(C, 'index.ts', index),
    getFile(C, 'controllers.ts', printControllers(operations)),
    getFile(C, 'actions.ts', printActionsFile(operations, spec.info.title)),
  ]);
}
