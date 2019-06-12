declare module 'swagger2openapi' {
  function convertObj(
    spec: unknown,
    opts: unknown,
    cb: (err: Error, options: { openapi: unknown }) => void
  ): void;
}
