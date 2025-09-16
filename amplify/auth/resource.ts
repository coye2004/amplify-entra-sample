import { defineAuth, secret } from '@aws-amplify/backend';

export const auth = defineAuth({
  // 1) What users can log in with (local Cognito + external IdPs)
  loginWith: {
    email: true,
    externalProviders: {
      callbackUrls: ['http://localhost:5174/'],
      logoutUrls: ['http://localhost:5174/'],
      oidc: [
        {
          name: 'AutodeskEntra',
          issuerUrl: 'https://login.microsoftonline.com/87b99afb-a707-40ce-9edb-59da9c64c857/v2.0',
          clientId: secret('AUTODESK_ENTRA_ID_CLIENT_ID'),      // must be 77c7…
          clientSecret: secret('AUTODESK_ENTRA_ID_CLIENT_SECRET'),
          scopes: ['openid', 'profile', 'email'],
          attributeMapping: {
            email: 'email',
            preferredUsername: 'preferred_username',
            givenName: 'given_name',
            familyName: 'family_name',
          },
        },
      ],
    },
  },
});
