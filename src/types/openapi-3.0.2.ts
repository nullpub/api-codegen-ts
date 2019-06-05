import { Option } from 'fp-ts/lib/Option';
import * as t from 'io-ts';
import { createOptionFromNullable, fromNullable, mapOutput } from 'io-ts-types';

/**
 * Semver RegExp from https://github.com/sindresorhus/semver-regex/blob/master/index.js
 */
const SEMVER_REGEX = /(?<=^v?|\sv?)(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*)(?:\.(?:[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?(?=$|\s)/gi;

/**
 * Semver Refinement type to ensure that semver field matches the specification
 */
interface SemverBrand {
  readonly Semver: unique symbol;
}
const Semver = t.brand(
  t.string,
  (n): n is t.Branded<string, SemverBrand> => SEMVER_REGEX.test(n),
  'Semver'
);
type Semver = t.TypeOf<typeof Semver>;

/**
 * Helper Type to pull the Encode and Decode generics from a Codec
 */
type CodecOf<T> = T extends t.Type<infer A, infer O, infer I>
  ? [A, O, I]
  : never;

/**
 * Helper function to turn empty arrays into undefined on output
 */
const toUndefined = <A>(x: A | null): A | undefined =>
  Array.isArray(x) && x.length === 0 ? undefined : x;

/**
 * Higer order codec to default nullable booleans to false
 */
const nullableBooleanFalse = fromNullable(t.boolean)(false);

/**
 * Higher order codec to default nullable arrays of codec T to empty arrays
 * on decode.
 */
const nullableArray = <A, O = A, I = unknown>(codec: t.Type<A, O, I>) =>
  mapOutput(fromNullable(t.array(codec))([]), toUndefined);

/**
 * io-ts codecs for openapi 3.0.2
 *
 * These types are used to validate openapi 3.0.x json and cast it into
 * strong typescript types if it validates.
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md
 */

/**
 * Reference Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#referenceObject
 */
export const ReferenceObjectIO = t.type({
  $ref: t.string,
});
export type ReferenceObject = t.TypeOf<typeof ReferenceObjectIO>;

export const ContactObjectIO = t.type({
  name: createOptionFromNullable(t.string),
  url: createOptionFromNullable(t.string),
  email: createOptionFromNullable(t.string),
});
export type ContactObject = t.TypeOf<typeof ContactObjectIO>;

/**
 * License Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#licenseObject
 */
export const LicenseObjectIO = t.type({
  name: t.string,
  url: createOptionFromNullable(t.string),
});
export type LicenseObject = t.TypeOf<typeof LicenseObjectIO>;

/**
 * Info Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#InfoObject
 */
export const InfoObjectIO = t.type({
  title: t.string,
  description: createOptionFromNullable(t.string),
  termsOfService: createOptionFromNullable(t.string),
  contact: createOptionFromNullable(ContactObjectIO),
  license: createOptionFromNullable(LicenseObjectIO),
  version: t.string,
});
export type InfoObject = t.TypeOf<typeof InfoObjectIO>;

/**
 * Server Variable Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#ServerVariableObject
 */
export const ServerVariableObjectIO = t.type({
  enum: createOptionFromNullable(
    t.union([t.array(t.string), t.array(t.boolean), t.array(t.number)])
  ),
  default: t.union([t.string, t.boolean, t.number]),
  description: createOptionFromNullable(t.string),
});
export type ServerVariableObject = t.TypeOf<typeof ServerVariableObjectIO>;

/**
 * Server Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#ServerObject
 */
export const ServerObjectIO = t.type({
  url: t.string,
  description: createOptionFromNullable(t.string),
  variables: createOptionFromNullable(
    t.record(t.string, ServerVariableObjectIO)
  ),
});
export type ServerObject = t.TypeOf<typeof ServerObjectIO>;

/**
 * External Documentation Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#ExternalDocumentationObject
 */
export const ExternalDocumentationObjectIO = t.type({
  url: t.string,
  description: createOptionFromNullable(t.string),
});
export type ExternalDocumentationObject = t.TypeOf<
  typeof ExternalDocumentationObjectIO
>;
export type ExternalDocumentationObjectO = CodecOf<
  typeof ExternalDocumentationObjectIO
>[1];

/**
 * Parameter Location
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameter-locations
 */
export const ParameterLocationIO = t.union([
  t.literal('query'),
  t.literal('header'),
  t.literal('path'),
  t.literal('cookie'),
]);
export type ParameterLocation = t.TypeOf<typeof ParameterLocationIO>;

/**
 * Parameter Style
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#ParameterStyle
 */
export const ParameterStyleIO = t.union([
  t.literal('matrix'),
  t.literal('label'),
  t.literal('form'),
  t.literal('simple'),
  t.literal('spaceDelimited'),
  t.literal('pipeDelimited'),
  t.literal('deepObject'),
]);
export type ParameterStyle = t.TypeOf<typeof ParameterStyleIO>;

/**
 * Exmaple Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#exampleObject
 */
export const ExampleObjectIO = t.type({
  summary: createOptionFromNullable(t.string),
  description: createOptionFromNullable(t.string),
  value: createOptionFromNullable(t.any),
  externalValue: createOptionFromNullable(t.string),
});
export type ExmapleObject = t.TypeOf<typeof ExampleObjectIO>;

/**
 * Link Parameters Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#linkObject
 */
export const LinkParametersObjectIO = t.record(t.string, t.any);
export type LinkParametersObject = t.TypeOf<typeof LinkParametersObjectIO>;

/**
 * Link Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#linkObject
 */
export const LinkObjectIO = t.type({
  operationRef: createOptionFromNullable(t.string),
  operationId: createOptionFromNullable(t.string),
  parameters: createOptionFromNullable(LinkParametersObjectIO),
  requestBody: createOptionFromNullable(t.any),
  description: createOptionFromNullable(t.string),
  server: createOptionFromNullable(ServerObjectIO),
});
export type LinkObject = t.TypeOf<typeof LinkObjectIO>;

/**
 * Links Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#linkObject
 */
export const LinksObjectIO = t.record(
  t.string,
  t.union([LinkObjectIO, ReferenceObjectIO])
);
export type LinksObject = t.TypeOf<typeof LinksObjectIO>;

/**
 * Tag Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#TagObject
 */
export const TagObjectIO = t.type({
  name: t.string,
  description: createOptionFromNullable(t.string),
  externalDocs: createOptionFromNullable(ExternalDocumentationObjectIO),
});
export type TagObject = t.TypeOf<typeof TagObjectIO>;

/**
 * Examples Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#exampleObject
 */
export const ExamplesObjectIO = t.record(
  t.string,
  t.union([ExampleObjectIO, ReferenceObjectIO])
);
export type ExamplesObject = t.TypeOf<typeof ExamplesObjectIO>;

/**
 * Schema Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#SchemaObject
 */
export type SchemaObject = {
  nullable: boolean;
  discriminator: Option<DiscriminatorObject>;
  readOnly: boolean;
  writeOnly: boolean;
  xml: Option<XmlObject>;
  externalDocs: Option<ExternalDocumentationObject>;
  example: Option<any>;
  examples: any[];
  deprecated: boolean;
  type: Option<string>;
  allOf: (SchemaObject | ReferenceObject)[];
  oneOf: (SchemaObject | ReferenceObject)[];
  anyOf: (SchemaObject | ReferenceObject)[];
  not: Option<SchemaObject | ReferenceObject>;
  items: Option<SchemaObject | ReferenceObject>;
  properties: Option<Record<string, SchemaObject | ReferenceObject>>;
  additionalProperties: Option<SchemaObject | ReferenceObject | boolean>;
  description: Option<string>;
  format: Option<string>;
  default: Option<any>;
  title: Option<string>;
  multipleOf: Option<number>;
  maximum: Option<number>;
  exclusiveMaximum: boolean;
  minimum: Option<number>;
  exclusiveMinimum: boolean;
  maxLength: Option<number>;
  minLength: Option<number>;
  pattern: Option<string>;
  maxItems: Option<number>;
  minItems: Option<number>;
  uniqueItems: boolean;
  maxProperties: Option<number>;
  minProperties: Option<number>;
  required: string[];
  enum: any[];
};
// This type is necessary to make the types work
export type SchemaObjectO = {
  nullable?: boolean;
  discriminator?: DiscriminatorObjectO;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: XmlObjectO;
  externalDocs?: ExternalDocumentationObjectO;
  example?: any;
  examples?: any[];
  deprecated?: boolean;
  type?: string;
  allOf?: (SchemaObjectO | ReferenceObject)[];
  oneOf?: (SchemaObjectO | ReferenceObject)[];
  anyOf?: (SchemaObjectO | ReferenceObject)[];
  not?: SchemaObjectO | ReferenceObject;
  items?: SchemaObjectO | ReferenceObject;
  properties?: {
    [propertyName: string]: SchemaObjectO | ReferenceObject;
  };
  additionalProperties?: SchemaObjectO | ReferenceObject | boolean;
  description?: string;
  format?: string;
  default?: any;
  title?: string;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  enum?: any[];
};
export const SchemaObjectIO: t.Type<SchemaObject, SchemaObjectO> = t.recursion(
  'SchemaObjectIO',
  () =>
    t.type({
      nullable: nullableBooleanFalse,
      discriminator: createOptionFromNullable(DiscriminatorObjectIO),
      readOnly: nullableBooleanFalse,
      writeOnly: nullableBooleanFalse,
      xml: createOptionFromNullable(XmlObjectIO),
      externalDocs: createOptionFromNullable(ExternalDocumentationObjectIO),
      example: createOptionFromNullable(t.any),
      examples: nullableArray(t.any),
      deprecated: nullableBooleanFalse,
      type: createOptionFromNullable(t.string),
      allOf: nullableArray(t.union([SchemaObjectIO, ReferenceObjectIO])),
      oneOf: nullableArray(t.union([SchemaObjectIO, ReferenceObjectIO])),
      anyOf: nullableArray(t.union([SchemaObjectIO, ReferenceObjectIO])),
      not: createOptionFromNullable(
        t.union([SchemaObjectIO, ReferenceObjectIO])
      ),
      items: createOptionFromNullable(
        t.union([SchemaObjectIO, ReferenceObjectIO])
      ),
      properties: createOptionFromNullable(
        t.record(t.string, t.union([SchemaObjectIO, ReferenceObjectIO]))
      ),
      additionalProperties: createOptionFromNullable(
        t.union([SchemaObjectIO, ReferenceObjectIO, t.boolean])
      ),
      description: createOptionFromNullable(t.string),
      format: createOptionFromNullable(t.string),
      default: createOptionFromNullable(t.any),
      title: createOptionFromNullable(t.string),
      multipleOf: createOptionFromNullable(t.number),
      maximum: createOptionFromNullable(t.number),
      exclusiveMaximum: nullableBooleanFalse,
      minimum: createOptionFromNullable(t.number),
      exclusiveMinimum: nullableBooleanFalse,
      maxLength: createOptionFromNullable(t.number),
      minLength: createOptionFromNullable(t.number),
      pattern: createOptionFromNullable(t.string),
      maxItems: createOptionFromNullable(t.number),
      minItems: createOptionFromNullable(t.number),
      uniqueItems: nullableBooleanFalse,
      maxProperties: createOptionFromNullable(t.number),
      minProperties: createOptionFromNullable(t.number),
      required: nullableArray(t.string),
      enum: nullableArray(t.any),
    })
);

/**
 * Media Type Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#MediaTypeObject
 */
export const MediaTypeObjectIO = t.type({
  schema: createOptionFromNullable(
    t.union([SchemaObjectIO, ReferenceObjectIO])
  ),
  examples: createOptionFromNullable(ExamplesObjectIO),
  example: createOptionFromNullable(t.any),
  // encoding: createOptionFromNullable(EncodingObjectIO), // I'm too lazy to implement mutual recursion right now
});
export type MediaTypeObject = t.TypeOf<typeof MediaTypeObjectIO>;

/**
 * Content Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#media-type-object
 */
export const ContentObjectIO = t.record(t.string, MediaTypeObjectIO);
export type ContentObject = t.TypeOf<typeof ContentObjectIO>;

/**
 * Base Parameter Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameterObject
 */
export const BaseParameterObjectIO = t.type({
  description: createOptionFromNullable(t.string),
  required: nullableBooleanFalse,
  deprecated: nullableBooleanFalse,
  allowEmptyValue: nullableBooleanFalse,
  style: createOptionFromNullable(ParameterStyleIO),
  explode: nullableBooleanFalse,
  allowReserved: nullableBooleanFalse,
  schema: createOptionFromNullable(
    t.union([SchemaObjectIO, ReferenceObjectIO])
  ),
  examples: createOptionFromNullable(
    t.record(t.string, t.union([ExampleObjectIO, ReferenceObjectIO]))
  ),
  example: createOptionFromNullable(t.any),
  content: createOptionFromNullable(ContentObjectIO),
});
export type BaseParameterObject = t.TypeOf<typeof BaseParameterObjectIO>;

/**
 * Header Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#HeaderObject
 */
export const HeaderObjectIO = BaseParameterObjectIO;
export type HeaderObject = t.TypeOf<typeof HeaderObjectIO>;

/**
 * Headers Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#HeaderObject
 */
export const HeadersObjectIO = t.record(
  t.string,
  t.union([HeaderObjectIO, ReferenceObjectIO])
);
export type HeadersObject = t.TypeOf<typeof HeadersObjectIO>;

/**
 * Response Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#ResponseObject
 */
export const ResponseObjectIO = t.type({
  description: t.string,
  headers: createOptionFromNullable(HeadersObjectIO),
  content: createOptionFromNullable(ContentObjectIO),
  links: createOptionFromNullable(LinksObjectIO),
});
export type ResponseObject = t.TypeOf<typeof ResponseObjectIO>;

/**
 * Responses Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#ResponseObject
 */
export const ResponsesObjectIO = t.union([
  t.type({
    default: createOptionFromNullable(
      t.union([ResponseObjectIO, ReferenceObjectIO])
    ),
  }),
  t.record(t.string, t.union([ResponseObjectIO, ReferenceObjectIO])),
]);
export type ResponsesObject = t.TypeOf<typeof ResponsesObjectIO>;

/**
 * Encoding Property Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#encodingObject
 */
export const EncodingPropertyObjectIO = t.type({
  contentType: createOptionFromNullable(t.string),
  headers: createOptionFromNullable(
    t.record(t.string, t.union([HeaderObjectIO, ReferenceObjectIO]))
  ),
  style: createOptionFromNullable(t.string),
  explode: nullableBooleanFalse,
  allowReserved: nullableBooleanFalse,
});
export type EncodingPropertyObject = t.TypeOf<typeof EncodingPropertyObjectIO>;

/**
 * Encoding Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#encodingObject
 */
export const EncodingObjectIO = t.record(t.string, EncodingPropertyObjectIO);
export type EncodingObject = t.TypeOf<typeof EncodingObjectIO>;

/**
 * Request Body Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#RequestBodyObject
 */
export const RequestBodyObjectIO = t.type({
  description: createOptionFromNullable(t.string),
  content: ContentObjectIO,
  required: nullableBooleanFalse,
});
export type RequestBodyObject = t.TypeOf<typeof RequestBodyObjectIO>;

/**
 * Schemas Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#SchemaObject
 */
export const SchemasObjectIO = t.record(t.string, SchemaObjectIO);
export type SchemasObject = t.TypeOf<typeof SchemasObjectIO>;

/**
 * Paramater Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameterObject
 */
export const ParameterObjectIO = t.union([
  BaseParameterObjectIO,
  t.type({
    name: t.string,
    in: ParameterLocationIO,
  }),
]);
export type ParameterObject = t.TypeOf<typeof ParameterObjectIO>;

/**
 * Discriminator Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#DiscriminatorObject
 */
export const DiscriminatorObjectIO = t.type({
  propertyName: t.string,
  mapping: createOptionFromNullable(t.record(t.string, t.string)),
});
export type DiscriminatorObject = t.TypeOf<typeof DiscriminatorObjectIO>;
export type DiscriminatorObjectO = CodecOf<typeof DiscriminatorObjectIO>[1];

/**
 * Xml Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#XmlObject
 */
export const XmlObjectIO = t.type({
  name: createOptionFromNullable(t.string),
  namespace: createOptionFromNullable(t.string),
  prefix: createOptionFromNullable(t.string),
  attribute: nullableBooleanFalse,
  wrapped: nullableBooleanFalse,
});
export type XmlObject = t.TypeOf<typeof XmlObjectIO>;
export type XmlObjectO = CodecOf<typeof XmlObjectIO>[1];

/**
 * Security Scheme Type
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#SecuritySchemeType
 */
export const SecuritySchemeTypeIO = t.union([
  t.literal('apiKey'),
  t.literal('http'),
  t.literal('oauth2'),
  t.literal('openIdConnect'),
]);
export type SecuritySchemeType = t.TypeOf<typeof SecuritySchemeTypeIO>;

/**
 * Scopes Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#oauth-flows-object
 */
export const ScopesObjectIO = t.record(t.string, t.string);
export type ScopesObject = t.TypeOf<typeof ScopesObjectIO>;

/**
 * OAuth Flow Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#oauth-flows-object
 */
export const OAuthFlowObjectIO = t.type({
  authorizationUrl: createOptionFromNullable(t.string),
  tokenUrl: createOptionFromNullable(t.string),
  refreshUrl: createOptionFromNullable(t.string),
  scopes: ScopesObjectIO,
});
export type OAuthFlowObject = t.TypeOf<typeof OAuthFlowObjectIO>;

/**
 * OAuth Flows Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#oauth-flows-object
 */
export const OAuthFlowsObjectIO = t.type({
  implicit: createOptionFromNullable(OAuthFlowObjectIO),
  password: createOptionFromNullable(OAuthFlowObjectIO),
  clientCredentials: createOptionFromNullable(OAuthFlowObjectIO),
  authorizationCode: createOptionFromNullable(OAuthFlowObjectIO),
});
export type OAuthFlowsObject = t.TypeOf<typeof OAuthFlowsObjectIO>;

/**
 * Security Scheme Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#SecuritySchemeObject
 */
export const SecuritySchemeObjectIO = t.type({
  type: SecuritySchemeTypeIO,
  description: createOptionFromNullable(t.string),
  name: createOptionFromNullable(t.string),
  in: createOptionFromNullable(t.string),
  scheme: createOptionFromNullable(t.string),
  bearerFormat: createOptionFromNullable(t.string),
  flows: createOptionFromNullable(OAuthFlowsObjectIO),
  openIdConnectUrl: createOptionFromNullable(t.string),
});
export type SecuritySchemeObject = t.TypeOf<typeof SecuritySchemeObjectIO>;

/**
 * Security Requirement Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#SecurityRequirementObject
 */
export const SecurityRequirementObjectIO = t.record(t.string, t.string);
export type SecurityRequirementObject = t.TypeOf<
  typeof SecurityRequirementObjectIO
>;

/**
 * Operation Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#OperationObject
 */
export const OperationObjectIO = t.type({
  tags: nullableArray(t.string),
  summary: createOptionFromNullable(t.string),
  description: createOptionFromNullable(t.string),
  externalDocs: createOptionFromNullable(ExternalDocumentationObjectIO),
  operationId: createOptionFromNullable(t.string),
  parameters: createOptionFromNullable(
    t.array(t.union([ParameterObjectIO, ReferenceObjectIO]))
  ),
  requestBody: createOptionFromNullable(
    t.union([RequestBodyObjectIO, ReferenceObjectIO])
  ),
  responses: ResponsesObjectIO,
  // callbacks: createOptionFromNullable(CallbacksObjectIO), // I'm too lazy to implement mutual recursion right now
  deprecated: nullableBooleanFalse,
  security: nullableArray(SecurityRequirementObjectIO),
  servers: nullableArray(ServerObjectIO),
});
export type OperationObject = t.TypeOf<typeof OperationObjectIO>;

/**
 * Path Item Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#PathItemObject
 */
export const PathItemObjectIO = t.type({
  $ref: createOptionFromNullable(t.string),
  summary: createOptionFromNullable(t.string),
  description: createOptionFromNullable(t.string),
  get: createOptionFromNullable(OperationObjectIO),
  put: createOptionFromNullable(OperationObjectIO),
  post: createOptionFromNullable(OperationObjectIO),
  delete: createOptionFromNullable(OperationObjectIO),
  options: createOptionFromNullable(OperationObjectIO),
  head: createOptionFromNullable(OperationObjectIO),
  patch: createOptionFromNullable(OperationObjectIO),
  trace: createOptionFromNullable(OperationObjectIO),
  servers: nullableArray(ServerObjectIO),
  parameters: createOptionFromNullable(
    t.array(t.union([ParameterObjectIO, ReferenceObjectIO]))
  ),
});
export type PathItemObject = t.TypeOf<typeof PathItemObjectIO>;

/**
 * Paths Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#PathItemObject
 */
export const PathsObjectIO = t.record(t.string, PathItemObjectIO);
export type PathsObject = t.TypeOf<typeof PathsObjectIO>;

/**
 * Callback Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#CallbackObject
 */
export const CallbackObjectIO = t.record(t.string, PathItemObjectIO);
export type CallbackObject = t.TypeOf<typeof CallbackObjectIO>;

/**
 * Callbacks Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#CallbackObject
 */
export const CallbacksObjectIO = t.record(
  t.string,
  t.union([CallbackObjectIO, ReferenceObjectIO])
);
export type CallbacksObject = t.TypeOf<typeof CallbacksObjectIO>;

/**
 * Components Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#ComponentsObject
 */
export const ComponentsObjectIO = t.type({
  schemas: createOptionFromNullable(
    t.record(t.string, t.union([SchemaObjectIO, ReferenceObjectIO]))
  ),
  responses: createOptionFromNullable(
    t.record(t.string, t.union([ResponseObjectIO, ReferenceObjectIO]))
  ),
  parameters: createOptionFromNullable(
    t.record(t.string, t.union([ParameterObjectIO, ReferenceObjectIO]))
  ),
  examples: createOptionFromNullable(
    t.record(t.string, t.union([ExampleObjectIO, ReferenceObjectIO]))
  ),
  requestBodies: createOptionFromNullable(
    t.record(t.string, t.union([RequestBodyObjectIO, ReferenceObjectIO]))
  ),
  headers: createOptionFromNullable(
    t.record(t.string, t.union([HeaderObjectIO, ReferenceObjectIO]))
  ),
  securitySchemes: createOptionFromNullable(
    t.record(t.string, t.union([SecuritySchemeObjectIO, ReferenceObjectIO]))
  ),
  links: createOptionFromNullable(
    t.record(t.string, t.union([LinkObjectIO, ReferenceObjectIO]))
  ),
  callbacks: createOptionFromNullable(
    t.record(t.string, t.union([CallbackObjectIO, ReferenceObjectIO]))
  ),
});
export type ComponentsObject = t.TypeOf<typeof ComponentsObjectIO>;

/**
 * Open API Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#openapi-object
 */
export const OpenAPIObjectIO = t.type({
  openapi: Semver,
  info: InfoObjectIO,
  servers: nullableArray(ServerObjectIO),
  paths: PathsObjectIO,
  components: createOptionFromNullable(ComponentsObjectIO),
  security: nullableArray(SecurityRequirementObjectIO),
  tags: nullableArray(TagObjectIO),
  externalDocs: createOptionFromNullable(ExternalDocumentationObjectIO),
});
export type OpenAPIObject = t.TypeOf<typeof OpenAPIObjectIO>;
