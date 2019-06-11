import { Option } from 'fp-ts/lib/Option';

export type SchemaObject = {
  nullable: boolean;
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

export type HttpMethod =
  | 'GET'
  | 'PUT'
  | 'POST'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD'
  | 'PATCH'
  | 'TRACE';

export interface Path {
  method: HttpMethod;
  path: string;
}
export interface Intermediate {
  paths: Path[];
  defs: Definition[];
}
