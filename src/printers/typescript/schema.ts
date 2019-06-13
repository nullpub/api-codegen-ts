import * as t from 'io-ts-codegen';
import { join } from 'path';

import { Config, File, toFile } from '../../core';
import { OpenAPIObject, ReferenceObject, SchemaObject } from '../../types/openapi-3.0.2';
import { isRef, parseRef } from './ref';

/**
 * JSON Schema printer
 *
 * This printer is meant to take the openapi json schema and turn it
 * into an array of declarations that io-ts-codegen understands.
 *
 * Since the resultant declarations need to be exported as runtime and
 * static types the reference key (the string that the record lives under)
 * must be kept as a context.
 */

interface StringSchema extends SchemaObject {
  type: 'string';
}

interface NumberSchema extends SchemaObject {
  type: 'number';
}

interface BooleanSchema extends SchemaObject {
  type: 'boolean';
}

interface ArraySchema extends SchemaObject {
  type: 'array';
  items?: SchemaObject | ReferenceObject;
}

interface ObjectSchema extends SchemaObject {
  type: 'object';
  properties: { [key: string]: JSONSchema };
  required: Array<string>;
}

interface StringEnumSchema extends SchemaObject {
  type: 'string';
  enum: string[];
}

export type JSONSchema =
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | ObjectSchema
  | ArraySchema
  | SchemaObject
  | StringEnumSchema
  | ReferenceObject;

export function getRequiredProperties(
  schema: ObjectSchema
): { [key: string]: true } {
  const required: { [key: string]: true } = {};
  if (schema.required) {
    schema.required.forEach(function(k) {
      required[k] = true;
    });
  }
  return required;
}

export function toInterfaceCombinator(
  schema: ObjectSchema,
  toFunction = to
): t.TypeReference {
  const required = getRequiredProperties(schema);
  const types = Object.keys(schema.properties).map(key =>
    t.property(
      key,
      toFunction(schema.properties[key], toFunction),
      !required.hasOwnProperty(key),
      schema.description
    )
  );
  return t.interfaceCombinator(types);
}

export function toStringEnumCombinator(
  schema: StringEnumSchema
): t.TypeReference {
  if (schema.enum.length > 1) {
    return t.keyofCombinator(schema.enum);
  } else if (schema.enum.length === 1) {
    return t.literalCombinator(schema.enum[0]);
  } else {
    return t.unknownType;
  }
}

export function toRefCombinator(
  schema: ReferenceObject
): t.CustomCombinator | t.UnknownType {
  const name = parseRef(schema.$ref);
  if (name.length === 0) {
    return t.unknownType;
  }
  return t.customCombinator(name, name, [name]);
}

export function to(schema: JSONSchema, toFunction = to): t.TypeReference {
  if (isRef(schema)) {
    return toRefCombinator(schema);
  }

  switch (schema.type) {
    case 'string':
      if (Array.isArray(schema.enum)) {
        return toStringEnumCombinator(schema as StringEnumSchema);
      }
      return t.stringType;

    case 'number':
    case 'integer':
      // TODO Add integer enum type here
      return t.numberType;

    case 'boolean':
      return t.booleanType;

    case 'object':
      if (schema.properties) {
        return toInterfaceCombinator(schema as ObjectSchema, toFunction);
      } else if (
        schema.additionalProperties &&
        typeof schema.additionalProperties !== 'boolean'
      ) {
        return t.recordCombinator(
          t.stringType,
          toFunction(schema.additionalProperties, toFunction)
        );
      }
      return t.unknownRecordType;

    case 'array':
      if (schema.items) {
        return t.arrayCombinator(toFunction(schema.items, toFunction));
      }
      return t.unknownArrayType;

    default:
      return t.unknownType;
  }
}

export function buildDeclaration(
  $ref: string,
  schema: SchemaObject
): t.TypeDeclaration {
  const reference = to(schema, to);
  const name = parseRef($ref);
  return t.typeDeclaration(name, reference, true, false, schema.description);
}

const IO_TS_IMPORT = `import * as t from 'io-ts';\n\n`;

/**
 * Standardize schema key to match any $ref string
 *
 * By design, schemas only reference other schemas with json pointers.
 * This restraint means we can make the schema key have the same value
 * as the ref string that points to it would. This makes matching the
 * "name" of a schema to the name of the associated $ref easy.
 */
const toSchemaArray = (
  schemaRecord: Record<string, SchemaObject>
): [string, SchemaObject][] =>
  Object.keys(schemaRecord).map(key => [
    `#/components/schemas/${key}`,
    schemaRecord[key],
  ]);

export const buildModels = (
  C: Config<OpenAPIObject>,
  fileName: string,
  schemaRecord: Record<string, SchemaObject>
): File => {
  const schemaArray = toSchemaArray(schemaRecord);
  const declarations = schemaArray.map(([key, schema]) =>
    buildDeclaration(key, schema)
  );
  const declarationString = t
    .sort(declarations)
    .map(d => `${t.printStatic(d)}\n${t.printRuntime(d)}\n`)
    .join('\n');

  return toFile(join(C.dst, fileName), `${IO_TS_IMPORT}${declarationString}`);
};
