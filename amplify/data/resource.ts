import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { myFunction } from '../functions/my-function/resource';

const schema = a.schema({
  User: a.model({
    email: a.string().required(),
    name: a.string(),
    createdAt: a.datetime(),
  }).authorization((allow) => [allow.authenticated()]),

  // Test function as a GraphQL mutation
  testFunction: a
    .mutation()
    .arguments({
      input: a.string(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(myFunction)),

  // Get user info mutation
  getUserInfo: a
    .mutation()
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(myFunction)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
