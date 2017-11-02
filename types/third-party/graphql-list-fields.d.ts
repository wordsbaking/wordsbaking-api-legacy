declare module 'graphql-list-fields' {
  import {GraphQLResolveInfo} from 'graphql';

  function getFieldList(info: GraphQLResolveInfo): string[];

  export = getFieldList;
}
