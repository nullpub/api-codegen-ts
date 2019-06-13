# API Codegen TODO

## Goal: Typescript outputs three files - index.ts, controllers.ts, and models.ts

1. Move read source into core (parsers should receive File[] and output I) - DONE
2. Pull all of typescript printer into the following files:

- schema.ts - parses schema into File so we don't have to import - DONE
- controller.ts - parses schema into Controller
- core.ts - manages flow for schema and controller

3. Hoist all body / response schemas into the schemas object

## Goal: Throw together simple web based pipeline for openapi/swagger to typescript

## Future Work

- Add differ as config option. Should follow `(a: string, b: string): string` pattern
  where output string is the diff to print.
- Run prettier on output files?

### fromOperation: https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#operationObject

- operationId -> controller name
  -? summary & description -> comment
  -? parameters -> Record<string, number | string> (can only be in url)
  -? requestBody -> $ref | io-ts type
-? responses['default' | 200] -> $ref | io-ts type
