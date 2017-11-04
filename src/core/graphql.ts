import {buildSchema} from 'graphql';

import {User, UserGraphQLSchema} from '../model';

import {UserRequest} from './user';

export const schema = buildSchema(`
  ${[UserGraphQLSchema].join()}

  type Query {
    user: User
  }
`);

export interface UserQueryArgs {
  id: string;
}

export const rootValue = {
  async user(_args: UserQueryArgs, {user}: UserRequest): Promise<User> {
    return user as any;
  },
};
