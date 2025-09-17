import { defineAuth, secret } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      // required at this level
      callbackUrls: [
        'http://localhost:5174/',
        'https://main.d2j5lex9wj9ikc.amplifyapp.com/'
      ],
      logoutUrls: [
        'http://localhost:5174/',
        'https://main.d2j5lex9wj9ikc.amplifyapp.com/'
      ],

      // OIDC IdP definition
      oidc: [
        {
          name: 'AutodeskEntraIDTest',
          clientId: secret('AUTODESK_ENTRA_ID_CLIENT_ID'),
          clientSecret: secret('AUTODESK_ENTRA_ID_CLIENT_SECRET'),
          issuerUrl: 'https://login.microsoftonline.com/87b99afb-a707-40ce-9edb-59da9c64c857/v2.0',
          scopes: ['openid', 'profile', 'email'],
          attributeMapping: {
            email: 'preferred_username', // Try preferred_username as email
            givenName: 'given_name',
            familyName: 'family_name',
          },
        },
      ],
    },
  },
});
