export const handler = async () => {
  // Secrets are exposed to the function via environment variables
  const clientSecret = process.env['AUTODESK_ENTRA_ID_CLIENT_SECRET'];
  const runtimeEnv = process.env['RUNTIME_ENV'];
  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      runtimeEnv,
      hasSecret: Boolean(clientSecret && clientSecret.length > 0),
    })
  };
};
