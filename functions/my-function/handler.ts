export const handler = async (event: any) => {
  // Security: Minimal logging for production
  const runtimeEnv = process.env['RUNTIME_ENV'];
  
  // Security: Only log in development
  if (runtimeEnv === 'development') {
    console.log('GraphQL Event received');
  }
  
  // Handle different GraphQL operations
  const fieldName = event.info?.fieldName || event.fieldName || event.operationName;
  
  switch (fieldName) {
    case 'testFunction':
      // Security: Sanitize and limit input
      const input = (event.arguments?.input || 'No input provided').substring(0, 100);
      
      return {
        ok: true,
        message: `GraphQL Lambda function executed successfully!`,
        input: input,
        timestamp: new Date().toISOString()
        // Security: Removed debug information, runtimeEnv, and hasSecret
      };
      
    case 'getUserInfo':  // ← This MUST match the GraphQL field name exactly
      // Security: Extract only safe user info, no sensitive claims
      const user = event.identity?.claims || {};
      
      // Security: Validate that we have a valid user
      if (!user.email && !user['cognito:username']) {
        return {
          ok: false,
          message: 'User not authenticated',
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        ok: true,
        message: `User profile retrieved successfully!`,
        user: {
          email: user.email || user['cognito:username'],
          username: user['cognito:username'],
          verified: user.email_verified
          // Security: Removed groups, runtimeEnv, hasSecret, and debug info
        },
        timestamp: new Date().toISOString()
      };
      
    default:
      return {
        ok: false,
        message: 'Operation not supported',
        timestamp: new Date().toISOString()
        // Security: Removed debug information and field name exposure
      };
  }
};
