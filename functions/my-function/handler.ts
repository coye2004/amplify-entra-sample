export const handler = async (event: any) => {
  // Secrets are exposed to the function via environment variables
  const clientSecret = process.env['AUTODESK_ENTRA_ID_CLIENT_SECRET'];
  const runtimeEnv = process.env['RUNTIME_ENV'];
  
  console.log('GraphQL Event:', JSON.stringify(event, null, 2));
  
  // Handle different GraphQL operations
  const fieldName = event.info?.fieldName;
  
  switch (fieldName) {
    case 'testFunction':
      const input = event.arguments?.input || 'No input provided';
      return {
        ok: true,
        message: `GraphQL Lambda function executed successfully!`,
        input: input,
        runtimeEnv,
        hasSecret: Boolean(clientSecret && clientSecret.length > 0),
        timestamp: new Date().toISOString(),
        operation: 'testFunction'
      };
      
    case 'getUserInfo':
      // Extract user info from the GraphQL context
      const user = event.identity?.claims || {};
      return {
        ok: true,
        message: `User information retrieved successfully!`,
        user: {
          email: user.email || user['cognito:username'],
          username: user['cognito:username'],
          groups: user['cognito:groups'] || [],
          verified: user.email_verified
        },
        runtimeEnv,
        hasSecret: Boolean(clientSecret && clientSecret.length > 0),
        timestamp: new Date().toISOString(),
        operation: 'getUserInfo'
      };
      
    default:
      return {
        ok: false,
        message: `Unknown operation: ${fieldName}`,
        timestamp: new Date().toISOString()
      };
  }
};
