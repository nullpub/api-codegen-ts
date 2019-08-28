export const utilities = `import { AsyncActionCreators, Meta } from '@nll/dux/lib/Actions';
import { effectsFactory } from '@nll/dux/lib/Effects';
import { isLeft } from 'fp-ts/lib/Either';
import { Type } from 'io-ts';
import { Observable, of, throwError } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

export interface ApiRequest {
  url: string;
  body?: any;
  method:
    | 'get'
    | 'put'
    | 'post'
    | 'delete'
    | 'options'
    | 'head'
    | 'patch'
    | 'trace';
}

export interface ApiConfig {
  request: (request: ApiRequest) => Observable<unknown>;
  server: string;
}

export interface Request {
  path?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
}

export type Controller<Req extends Request, Res> = (
  req: Req
) => Observable<Res>;

export type ControllerFactory<Req extends Request, Res> = (
  config: ApiConfig
) => (req: Req) => Observable<Res>;

export type ReqlessControllerFactory<Res> = (
  config: ApiConfig
) => () => Observable<Res>;

export const pathMapper = (
  path: string,
  properties: Record<string, any> = {}
): string =>
  Object.keys(properties).reduce(
    (p, key) => p.replace(\`{\${key}}\`, encodeURIComponent(properties[key])),
    path
  );

export const queryMapper = (query: Record<string, any> = {}): string => {
  const queryItems = Object.keys(query);
  if (queryItems.length === 0) {
    return '';
  }
  return \`?\${queryItems
    .map(key => \`\${encodeURIComponent(key)}=\${encodeURIComponent(query[key])}\`)
    .join('&')}\`;
};

export const effects = <P = void, R = void, E = void, M extends Meta = Meta>(
  action: AsyncActionCreators<P, R, E, M>,
  controllerFactory: ControllerFactory<P, R>
) => (config: ApiConfig) => effectsFactory(action, controllerFactory(config));

export const reqlessEffects = <R = void, E = void, M extends Meta = Meta>(
  action: AsyncActionCreators<void, R, E, M>,
  controllerFactory: ReqlessControllerFactory<R>
) => (config: ApiConfig) => effectsFactory(action, controllerFactory(config));

export const controllerFactory = <Req extends Request, Res>(
  codec: Type<Res>,
  method: ApiRequest['method'],
  path: string
): ControllerFactory<Req, Res> => ({ request, server }) => req => {
  const query = queryMapper(req.query);
  const url = \`\${server}\${pathMapper(path, req.path)}\${query}\`;

  return request({ method, url, body: req.body }).pipe(
    map(codec.decode),
    mergeMap(r => (isLeft(r) ? throwError(r.left) : of(r.right)))
  );
};

export const requestlessControllerFactory = <Res>(
  codec: Type<Res>,
  method: ApiRequest['method'],
  path: string
): ReqlessControllerFactory<Res> => ({ request, server }) => () => {
  const url = \`\${server}\${path}\`;

  return request({ method, url }).pipe(
    map(codec.decode),
    mergeMap(r => (isLeft(r) ? throwError(r.left) : of(r.right)))
  );
};`;
