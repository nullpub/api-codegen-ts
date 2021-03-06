# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.4.10](https://github.com/nullpub/api-codegen-ts/compare/v0.4.9...v0.4.10) (2019-08-28)



### [0.4.9](https://github.com/nullpub/api-codegen-ts/compare/v0.4.8...v0.4.9) (2019-08-22)


### Bug Fixes

* move peer dependencies into peer dependencies ([5e37fed](https://github.com/nullpub/api-codegen-ts/commit/5e37fed))



### [0.4.8](https://github.com/nullpub/api-codegen-ts/compare/v0.4.7...v0.4.8) (2019-08-14)


### Bug Fixes

* updated packages ([202c0a2](https://github.com/nullpub/api-codegen-ts/commit/202c0a2))



### [0.4.7](https://github.com/nullpub/api-codegen-ts/compare/v0.4.6...v0.4.7) (2019-08-03)


### Bug Fixes

* try to generate unique name with operationId does not exist ([339518c](https://github.com/nullpub/api-codegen-ts/commit/339518c))



### [0.4.6](https://github.com/nullpub/api-codegen-ts/compare/v0.4.5...v0.4.6) (2019-07-30)



### [0.4.5](https://github.com/nullpub/api-codegen-ts/compare/v0.4.4...v0.4.5) (2019-07-30)


### Bug Fixes

* sanitize name of query and path params ([3611d8f](https://github.com/nullpub/api-codegen-ts/commit/3611d8f))



### [0.4.4](https://github.com/nullpub/api-codegen-ts/compare/v0.4.3...v0.4.4) (2019-07-30)


### Bug Fixes

* clean operationId so it can safely be used as a symbol ([e107836](https://github.com/nullpub/api-codegen-ts/commit/e107836))



### [0.4.3](https://github.com/nullpub/api-codegen-ts/compare/v0.4.2...v0.4.3) (2019-07-30)


### Bug Fixes

* target */* content type as a fallback to application/json ([2b58a57](https://github.com/nullpub/api-codegen-ts/commit/2b58a57))



### [0.4.2](https://github.com/nullpub/api-codegen-ts/compare/v0.4.1...v0.4.2) (2019-07-30)


### Bug Fixes

* add catchall response to findSuccessResponse ([934a529](https://github.com/nullpub/api-codegen-ts/commit/934a529))



### [0.4.1](https://github.com/nullpub/api-codegen-ts/compare/v0.4.0...v0.4.1) (2019-07-30)


### Bug Fixes

* operationId is not required on an operation ([beeab6a](https://github.com/nullpub/api-codegen-ts/commit/beeab6a))



## [0.4.0](https://github.com/nullpub/api-codegen-ts/compare/v0.3.2...v0.4.0) (2019-07-30)


### Features

* actions, reducers, and effects ([4281a4e](https://github.com/nullpub/api-codegen-ts/commit/4281a4e))



### [0.3.2](https://github.com/nullpub/api-codegen-ts/compare/v0.3.1...v0.3.2) (2019-07-29)


### Bug Fixes

* run convertSpec once ([bb0ebaa](https://github.com/nullpub/api-codegen-ts/commit/bb0ebaa))



### [0.3.1](https://github.com/nullpub/api-codegen-ts/compare/v0.3.0...v0.3.1) (2019-07-29)


### Bug Fixes

* fixed pathing of written converted spec ([9d77258](https://github.com/nullpub/api-codegen-ts/commit/9d77258))



## [0.3.0](https://github.com/nullpub/api-codegen-ts/compare/v0.2.2...v0.3.0) (2019-07-29)


### Features

* print converted spec and loosen openapi 3.0.2 validator ([eafdce7](https://github.com/nullpub/api-codegen-ts/commit/eafdce7))



### [0.2.2](https://github.com/nullpub/api-codegen-ts/compare/v0.2.1...v0.2.2) (2019-07-29)



### [0.2.1](https://github.com/nullpub/api-codegen-ts/compare/v0.2.0...v0.2.1) (2019-07-29)


### Bug Fixes

* remove naming conflicts for index.ts ([9ab5292](https://github.com/nullpub/api-codegen-ts/commit/9ab5292))



## [0.2.0](https://github.com/nullpub/api-codegen-ts/compare/v0.1.3...v0.2.0) (2019-07-29)


### Features

* added barrel export to typescript printer files ([2452fe3](https://github.com/nullpub/api-codegen-ts/commit/2452fe3))



### [0.1.3](https://github.com/nullpub/api-codegen-ts/compare/v0.1.2...v0.1.3) (2019-07-28)



### [0.1.2](https://github.com/nullpub/api-codegen-ts/compare/v0.1.0...v0.1.2) (2019-07-28)



## 0.1.0 (2019-07-28)


### Bug Fixes

* removed taskEither from MonadApp, made config funcs return TaskEither ([5525184](https://github.com/nullpub/api-codegen-ts/commit/5525184))
* **build:** fix type errors after adding tsconfig ([88df72c](https://github.com/nullpub/api-codegen-ts/commit/88df72c))


### Features

* initial working build ([722471f](https://github.com/nullpub/api-codegen-ts/commit/722471f))
* **logging:** cleaned up logging to make progress clear ([d98dbd9](https://github.com/nullpub/api-codegen-ts/commit/d98dbd9))
* **openapi-3.0.2:** implemented fromNullables to make delving through types easier ([21f5a20](https://github.com/nullpub/api-codegen-ts/commit/21f5a20))
* **parser:** initial parser work done ([c3fd0f9](https://github.com/nullpub/api-codegen-ts/commit/c3fd0f9))
* **swagger:** implemented swagger parser using swagger2openapi ([366a191](https://github.com/nullpub/api-codegen-ts/commit/366a191))
* **types:** inital io-ts codec for openapi 3.0.x spec ([43ce60a](https://github.com/nullpub/api-codegen-ts/commit/43ce60a))
