# api-codegen-ts

A general typescript code generation library. Currently it can take swagger 2.0 and openapi 3.0.0+ json specs and turn them into typescript controllers that validate api responses.

## Installation

`npm i -D @nll/api-codegen-ts`

## Configuration

Add an apiCodegen section to `package.json`.

```json
{
  "apiCodegen": {
    "src": "./path/to/your/swagger-spec.json",
    "dst": "./path/to/your/codegen/destination"
  }
}
```

## Usage

After configuring api-codegen-ts you can generate code like so:

`npx @nll/api-codegen-ts`

And it will output its progress and output code.

## Advanced usage

This codegen library abstracts parsers and printers. A parser is responsible for receiving an input string (a specification) and generating any intermediate representation. Currently, there are primitive swagger 2.0 and openapi 3.0.0 parsers. A printer takes an intermediate representation (it must match whatever the parser outputs) and returns the file strings to write to disk. The core functionality of api-codegen-ts is managing this workflow, it handles the reading of the source files and the printing of the generated files.

## Support

This is my first attempt at a codegen library. If you find bugs or some set of features that aren't supported please create a github issue. Thanks!
