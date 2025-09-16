import { defineFunction, secret } from '@aws-amplify/backend';

export const myFunction = defineFunction({
  entry: '../../../functions/my-function/handler.ts',
  environment: {
    // You can also pass non-secret config here
    RUNTIME_ENV: 'dev'
  }
});
