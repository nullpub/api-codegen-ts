import * as t from 'io-ts';
import { fromNullable } from 'io-ts-types/lib/fromNullable';

/**
 * Semver RegExp from https://github.com/sindresorhus/semver-regex/blob/master/index.js
 */
const SEMVER_REGEX = /(?<=^v?|\sv?)(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*)(?:\.(?:[1-9]\d*|[\da-z-]*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?(?=$|\s)/gi;

/**
 * Semver Refinement type to ensure that semver field matches the specification
 */
export interface SemverBrand {
  readonly Semver: unique symbol;
}
export const Semver = t.brand(
  t.string,
  (n): n is t.Branded<string, SemverBrand> => SEMVER_REGEX.test(n),
  'Semver'
);
export type Semver = t.TypeOf<typeof Semver>;

/**
 * io-ts codecs for openapi 3.0.2
 *
 * These types are used to validate openapi 3.0.x json and cast it into
 * strong typescript types if it validates. This means means that these
 * validators effectively operate as an openapi 3.0.2 parser.
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

export const ContactObjectIO = t.partial({
  name: t.string,
  url: t.string,
  email: t.string,
});
export type ContactObject = t.TypeOf<typeof ContactObjectIO>;

/**
 * License Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#licenseObject
 */
export const LicenseObjectIO = t.intersection([
  t.type({
    name: t.string,
  }),
  t.partial({
    url: t.string,
  }),
]);
export type LicenseObject = t.TypeOf<typeof LicenseObjectIO>;

/**
 * Info Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#InfoObject
 */
export const InfoObjectIO = t.intersection([
  t.type({
    title: t.string,
    version: t.string,
  }),
  t.partial({
    description: t.string,
    termsOfService: t.string,
    contact: ContactObjectIO,
    license: LicenseObjectIO,
  }),
]);
export type InfoObject = t.TypeOf<typeof InfoObjectIO>;

/**
 * Server Variable Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#ServerVariableObject
 */
export const ServerVariableObjectIO = t.partial({
  enum: t.array(t.string),
  default: t.union([t.string, t.boolean, t.number]),
  description: t.string,
});
export type ServerVariableObject = t.TypeOf<typeof ServerVariableObjectIO>;

/**
 * Server Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#ServerObject
 */
export const ServerObjectIO = t.intersection([
  t.type({
    url: t.string,
  }),
  t.partial({
    description: t.string,
    variables: t.record(t.string, ServerVariableObjectIO),
  }),
]);
export type ServerObject = t.TypeOf<typeof ServerObjectIO>;

/**
 * External Documentation Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#ExternalDocumentationObject
 */
export const ExternalDocumentationObjectIO = t.intersection([
  t.type({
    url: t.string,
  }),
  t.partial({
    description: t.string,
  }),
]);
export type ExternalDocumentationObject = t.TypeOf<
  typeof ExternalDocumentationObjectIO
>;

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
export const ExampleObjectIO = t.partial({
  summary: t.string,
  description: t.string,
  value: t.any,
  externalValue: t.string,
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
export const LinkObjectIO = t.partial({
  operationRef: t.string,
  operationId: t.string,
  parameters: LinkParametersObjectIO,
  requestBody: t.any,
  description: t.string,
  server: ServerObjectIO,
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
export const TagObjectIO = t.intersection([
  t.type({
    name: t.string,
  }),
  t.partial({
    description: t.string,
    externalDocs: ExternalDocumentationObjectIO,
  }),
]);
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

// This type is necessary to make the types work
export type SchemaObject = {
  nullable?: boolean;
  discriminator?: DiscriminatorObject;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: XmlObject;
  externalDocs?: ExternalDocumentationObject;
  example?: any;
  examples?: any[];
  deprecated?: boolean;
  type?: string;
  allOf?: (SchemaObject | ReferenceObject)[];
  oneOf?: (SchemaObject | ReferenceObject)[];
  anyOf?: (SchemaObject | ReferenceObject)[];
  not?: SchemaObject | ReferenceObject;
  items?: SchemaObject | ReferenceObject;
  properties?: Record<string, SchemaObject | ReferenceObject>;
  additionalProperties?: SchemaObject | ReferenceObject | boolean;
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
export const SchemaObjectIO: t.Type<SchemaObject> = t.recursion(
  'SchemaObject',
  () =>
    t.partial({
      /**
       * These are not currently used and something here causes an issue with io-ts
       */

      // nullable: t.boolean,
      // discriminator: DiscriminatorObjectIO,
      // readOnly: t.boolean,
      // writeOnly: t.boolean,
      // xml: XmlObjectIO,
      // externalDocs: ExternalDocumentationObjectIO,
      // example: t.any,
      // examples: t.array(t.any),
      // deprecated: t.boolean,
      type: t.string,
      // allOf: t.array(t.union([SchemaObjectIO, ReferenceObjectIO])),
      // oneOf: t.array(t.union([SchemaObjectIO, ReferenceObjectIO])),
      // anyOf: t.array(t.union([SchemaObjectIO, ReferenceObjectIO])),
      // not: t.union([SchemaObjectIO, ReferenceObjectIO]),
      items: t.union([SchemaObjectIO, ReferenceObjectIO]),
      properties: t.record(
        t.string,
        t.union([SchemaObjectIO, ReferenceObjectIO])
      ),
      additionalProperties: t.union([
        SchemaObjectIO,
        ReferenceObjectIO,
        t.boolean,
      ]),
      description: t.string,
      // format: t.string,
      // default: t.any,
      // title: t.string,
      // multipleOf: t.number,
      // maximum: t.number,
      // exclusiveMaximum: t.boolean,
      // minimum: t.number,
      // exclusiveMinimum: t.boolean,
      // maxLength: t.number,
      // minLength: t.number,
      // pattern: t.string,
      // maxItems: t.number,
      // minItems: t.number,
      // uniqueItems: t.boolean,
      // maxProperties: t.number,
      // minProperties: t.number,
      required: t.array(t.string),
      enum: t.array(t.any),
    })
);

/**
 * Media Type Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#MediaTypeObject
 */
export const MediaTypeObjectIO = t.partial({
  schema: t.union([SchemaObjectIO, ReferenceObjectIO]),
  examples: ExamplesObjectIO,
  example: t.any,
  // encoding: EncodingObjectIO, // I'm too lazy to implement mutual recursion right now
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
export const BaseParameterObjectIO = t.partial({
  description: t.string,
  required: t.boolean,
  deprecated: t.boolean,
  allowEmptyValue: t.boolean,
  style: ParameterStyleIO,
  explode: t.boolean,
  allowReserved: t.boolean,
  schema: t.union([SchemaObjectIO, ReferenceObjectIO]),
  examples: t.record(t.string, t.union([ExampleObjectIO, ReferenceObjectIO])),
  example: t.any,
  content: ContentObjectIO,
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
export const ResponseObjectIO = t.intersection([
  t.type({
    description: t.string,
  }),
  t.partial({
    headers: HeadersObjectIO,
    content: ContentObjectIO,
    links: LinksObjectIO,
  }),
]);
export type ResponseObject = t.TypeOf<typeof ResponseObjectIO>;

/**
 * Responses Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#ResponseObject
 */
export const ResponsesObjectIO = t.intersection([
  t.partial({
    default: t.union([ResponseObjectIO, ReferenceObjectIO]),
  }),
  t.record(t.string, t.union([ResponseObjectIO, ReferenceObjectIO])),
]);
export type ResponsesObject = t.TypeOf<typeof ResponsesObjectIO>;

/**
 * Encoding Property Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#encodingObject
 */
export const EncodingPropertyObjectIO = t.partial({
  contentType: t.string,
  headers: t.record(t.string, t.union([HeaderObjectIO, ReferenceObjectIO])),
  style: t.string,
  explode: t.boolean,
  allowReserved: t.boolean,
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
export const RequestBodyObjectIO = t.intersection([
  t.type({
    content: ContentObjectIO,
  }),
  t.partial({
    description: t.string,
    required: t.boolean,
  }),
]);
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
export const ParameterObjectIO = t.intersection([
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
export const DiscriminatorObjectIO = t.intersection([
  t.type({
    propertyName: t.string,
  }),
  t.partial({
    mapping: t.record(t.string, t.string),
  }),
]);
export type DiscriminatorObject = t.TypeOf<typeof DiscriminatorObjectIO>;

/**
 * Xml Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#XmlObject
 */
export const XmlObjectIO = t.partial({
  name: t.string,
  namespace: t.string,
  prefix: t.string,
  attribute: t.boolean,
  wrapped: t.boolean,
});
export type XmlObject = t.TypeOf<typeof XmlObjectIO>;

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
export const OAuthFlowObjectIO = t.intersection([
  t.type({
    scopes: ScopesObjectIO,
  }),
  t.partial({
    authorizationUrl: t.string,
    tokenUrl: t.string,
    refreshUrl: t.string,
  }),
]);
export type OAuthFlowObject = t.TypeOf<typeof OAuthFlowObjectIO>;

/**
 * OAuth Flows Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#oauth-flows-object
 */
export const OAuthFlowsObjectIO = t.partial({
  implicit: OAuthFlowObjectIO,
  password: OAuthFlowObjectIO,
  clientCredentials: OAuthFlowObjectIO,
  authorizationCode: OAuthFlowObjectIO,
});
export type OAuthFlowsObject = t.TypeOf<typeof OAuthFlowsObjectIO>;

/**
 * Security Scheme Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#SecuritySchemeObject
 */
export const SecuritySchemeObjectIO = t.partial({
  type: SecuritySchemeTypeIO,
  description: t.string,
  name: t.string,
  in: t.string,
  scheme: t.string,
  bearerFormat: t.string,
  flows: OAuthFlowsObjectIO,
  openIdConnectUrl: t.string,
});
export type SecuritySchemeObject = t.TypeOf<typeof SecuritySchemeObjectIO>;

/**
 * Security Requirement Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#SecurityRequirementObject
 */
export const SecurityRequirementObjectIO = t.record(
  t.string,
  SecuritySchemeObjectIO
);
export type SecurityRequirementObject = t.TypeOf<
  typeof SecurityRequirementObjectIO
>;

/**
 * Operation Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#OperationObject
 */
export const OperationObjectIO = t.intersection([
  t.type({
    responses: ResponsesObjectIO,
    operationId: t.string,
  }),
  t.partial({
    tags: t.array(t.string),
    summary: t.string,
    description: t.string,
    externalDocs: ExternalDocumentationObjectIO,
    // parameters: t.array(t.union([ParameterObjectIO, ReferenceObjectIO])),
    parameters: t.array(ParameterObjectIO),
    requestBody: t.union([RequestBodyObjectIO, ReferenceObjectIO]),
    // requestBody: RequestBodyObjectIO,
    // callbacks: CallbacksObjectIO, // I'm too lazy to implement mutual recursion right now
    deprecated: t.boolean,
    security: t.array(SecurityRequirementObjectIO),
    servers: t.array(ServerObjectIO),
  }),
]);
export type OperationObject = t.TypeOf<typeof OperationObjectIO>;

/**
 * Path Item Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#PathItemObject
 */
export const PathItemObjectIO = t.partial({
  $ref: t.string,
  summary: t.string,
  description: t.string,
  get: OperationObjectIO,
  put: OperationObjectIO,
  post: OperationObjectIO,
  delete: OperationObjectIO,
  options: OperationObjectIO,
  head: OperationObjectIO,
  patch: OperationObjectIO,
  trace: OperationObjectIO,
  servers: t.array(ServerObjectIO),
  // parameters: t.array(t.union([ParameterObjectIO, ReferenceObjectIO])),
  parameters: t.array(ParameterObjectIO),
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
 *
 * Components can no longer be refs themselves. Since this validator neither does url lookups
 * on refs nor does it collapse references, they would be superfluous. Operations can reference
 * schemas, responses, parameters, etc, but a component cannot "alias" to another component.
 *
 * This change is meant to make writing a printer easier. If you find that you need to support
 * refs in components then I welcome any pull request that also implements the ref following
 * in the typescript printer.
 */
export const ComponentsObjectIO = t.type({
  schemas: fromNullable(t.record(t.string, SchemaObjectIO), {}),
  responses: fromNullable(t.record(t.string, ResponseObjectIO), {}),
  parameters: fromNullable(t.record(t.string, ParameterObjectIO), {}),
  examples: fromNullable(t.record(t.string, ExampleObjectIO), {}),
  requestBodies: fromNullable(t.record(t.string, RequestBodyObjectIO), {}),
  headers: fromNullable(t.record(t.string, HeaderObjectIO), {}),
  securitySchemes: fromNullable(t.record(t.string, SecuritySchemeObjectIO), {}),
  links: fromNullable(t.record(t.string, LinkObjectIO), {}),
  callbacks: fromNullable(t.record(t.string, CallbackObjectIO), {}),
});
export type ComponentsObject = t.TypeOf<typeof ComponentsObjectIO>;

/**
 * Open API Object
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#openapi-object
 */
export const OpenAPIObjectIO = t.intersection([
  t.type({
    openapi: Semver,
    info: InfoObjectIO,
    paths: PathsObjectIO,
    components: fromNullable(ComponentsObjectIO, {
      schemas: {},
      responses: {},
      parameters: {},
      examples: {},
      requestBodies: {},
      headers: {},
      securitySchemes: {},
      links: {},
      callbacks: {},
    }),
  }),
  t.partial({
    servers: t.array(ServerObjectIO),
    security: t.array(SecurityRequirementObjectIO),
    tags: t.array(TagObjectIO),
    externalDocs: ExternalDocumentationObjectIO,
  }),
]);
export type OpenAPIObject = t.TypeOf<typeof OpenAPIObjectIO>;
