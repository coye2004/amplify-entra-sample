# Amplify + Microsoft Entra ID (OIDC) — Secrets Example

This sample shows how to configure **Amplify Gen 2** with an **OIDC provider (Microsoft Entra ID)** and manage **secrets** securely.

## Prerequisites
- Node.js 18+
- AWS account with Amplify Gen 2 enabled
- An Entra ID App Registration (Web), with:
  - **Redirect URI**: `https://<your-domain-or-amplify-app>/oauth2/idpresponse` (Cognito hosted UI)
  - **Client credentials** (client secret value)
  - **Tenant ID**
  - **Scopes**: `openid profile email`

## 1) Install deps
```bash
npm install
```

## 2) Add secrets (one-time)
```bash
npx ampx secret add AUTODESK_ENTRA_ID_CLIENT_ID
npx ampx secret add AUTODESK_ENTRA_ID_CLIENT_SECRET
npx ampx secret add AUTODESK_ENTRA_TENANT_ID
```
Paste the actual values when prompted.

## 3) Run a personal cloud sandbox (dev)
```bash
npm run dev
```
This provisions a personal, isolated environment. The CLI prints endpoints and the Cognito Hosted UI link. Use that link to test OIDC login.

## 4) Deploy shared env (optional)
```bash
npm run deploy
```

## Notes & Troubleshooting
- If you previously saw `Type 'BackendSecret' is not assignable to type 'string'` in `defineAuth`, update the packages to the latest:
  ```bash
  npm i -D @aws-amplify/backend@latest @aws-amplify/backend-cli@latest
  ```
- Secrets in **functions** appear as `process.env['SECRET_NAME']`.
- Secrets inside **backend definitions** (like `defineAuth`) are referenced **directly** (do not call `.value`).
- The Hosted UI callback path is managed by Cognito; you typically only set the Entra app's redirect URI. Amplify wires the provider to Cognito behind the scenes.
- To rotate a secret: run `npx ampx secret add <NAME>` again and redeploy.

## File Layout
```text
amplify-entra-sample/
├─ amplify/
│  ├─ backend.ts                 # registers secrets & resources
│  ├─ auth/resource.ts           # defineAuth with OIDC provider
│  └─ functions/my-function/resource.ts  # example lambda using a secret
├─ functions/my-function/handler.ts      # lambda entrypoint
├─ package.json
├─ tsconfig.json
└─ README.md
```
