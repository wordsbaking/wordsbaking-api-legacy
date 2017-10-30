import {graphiqlExpress, graphqlExpress} from 'apollo-server-express';
import * as BodyParser from 'body-parser';
import * as express from 'express';
import {GraphQLObjectType, GraphQLSchema, GraphQLString} from 'graphql';

const app = express();

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      hello: {
        type: GraphQLString,
        resolve() {
          return 'world!';
        },
      },
    },
  }),
});

app.use(
  '/graphql',
  BodyParser.json(),
  graphqlExpress({
    schema,
  }),
);

app.use(
  '/graphiql',
  graphiqlExpress({
    endpointURL: '/graphql',
  }),
);

app.listen(process.env.PORT || 1337);
