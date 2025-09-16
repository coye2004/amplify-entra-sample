import { defineAuth, secret } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    externalProviders: {
      // required at this level
      callbackUrls: ['http://localhost:5174/','https://main.d2j5lex9wj9ikc.amplifyapp.com/'],
      logoutUrls: ['http://localhost:5174/','https://main.d2j5lex9wj9ikc.amplifyapp.com/'],

      // OIDC IdP definition
      oidc: [
        {
          name: 'AutodeskEntra',
          issuerUrl: 'https://login.microsoftonline.com/87b99afb-a707-40ce-9edb-59da9c64c857/v2.0',
          clientId: secret('AUTODESK_ENTRA_ID_CLIENT_ID'),
          clientSecret: secret('AUTODESK_ENTRA_ID_CLIENT_SECRET'),
          scopes: ['openid', 'profile', 'email'],
        },
      ],
    },
  },
});
