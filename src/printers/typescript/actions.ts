import { Operation } from './controller';

const IMPORTS = `import { actionCreatorFactory } from '@nll/dux/lib/Actions';
import { asyncReducersFactory } from '@nll/dux/lib/Reducers';

import * as cs from './controllers'
import * as u from './utilities'`;

export interface AsyncAction {
  name: string;
  type: string;
  reducers: string;
  effects: string;
  reqType: string;
  resType: string;
  errType: string;
  controllerName: string;
}

const toCleanActionName = (name: string): string =>
  name
    .replace(/\s+/, '_')
    .replace(/[\\W]/, '')
    .toUpperCase();

const toAsyncAction = (operation: Operation): AsyncAction => ({
  name: `async${operation.name}`,
  type: toCleanActionName(operation.name),
  reducers: `async${operation.name}Reducers`,
  effects: `async${operation.name}Effects`,
  reqType: operation.requestDeclaration
    ? `cs.${operation.requestDeclaration.name}`
    : 'void',
  resType: `cs.${operation.responseDeclaration.name}`,
  errType: 'Error',
  controllerName: `cs.${operation.name}Factory`,
});

const printActionCreator = (name: string) =>
  `const actionCreator = actionCreatorFactory('${toCleanActionName(name)}');`;

const printAction = ({
  name,
  reqType,
  resType,
  errType,
  type,
}: AsyncAction): string => {
  return `export const ${name} = actionCreator.async<${reqType}, ${resType}, ${errType}>('${type}')`;
};

const printReducer = ({ name, reducers }: AsyncAction): string => {
  return `export const ${reducers} = asyncReducersFactory(${name});`;
};

const printEffects = ({
  effects,
  name,
  controllerName,
}: AsyncAction): string => {
  return `export const ${effects} = u.effects(${name}, ${controllerName})`;
};

const printActionBundle = (action: AsyncAction): string => {
  let output = [];
  output.push(printAction(action));
  output.push(printReducer(action));
  output.push(printEffects(action));
  return output.join('\n');
};

const printActions = (operations: Operation[]): string => {
  return operations
    .map(toAsyncAction)
    .map(printActionBundle)
    .join('\n\n');
};

export const printActionsFile = (
  operations: Operation[],
  name = 'UNKNOWN_API'
): string => {
  const output = [IMPORTS];
  output.push(printActionCreator(name));
  output.push(printActions(operations));
  return output.join('\n\n');
};
