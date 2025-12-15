# Supabase Edge Function Setup Guide

This guide explains how to deploy the `extract-receipt` Edge Function to keep your OpenAI API key secure.

## Prerequisites

1. Install the Supabase CLI: https://supabase.com/docs/guides/cli
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`

## Deploy the Edge Function

1. Navigate to your project directory
2. Deploy the function:
   ```bash
   supabase functions deploy extract-receipt
   ```

## Configure the OpenAI API Key

Add your OpenAI API key as a secret in Supabase:

```bash
supabase secrets set OPENAI_API_KEY=sk-your-api-key-here
```

Or via the Supabase Dashboard:
1. Go to your project in the Supabase Dashboard
2. Navigate to Settings > Edge Functions
3. Add a new secret: `OPENAI_API_KEY` with your OpenAI key

## Authentication Requirement

The Edge Function requires authenticated users. It validates the Supabase JWT token passed in the Authorization header. This means:

- Only logged-in users of your app can call this function
- Anonymous/unauthenticated requests are rejected with 401
- Your OpenAI quota is protected from abuse

The app automatically sends the user's session token when calling the function via `supabase.functions.invoke()`.

## How It Works

- **In Production**: The app calls the Edge Function with the user's auth token. The function validates the token, then securely accesses OpenAI using the key stored in Supabase secrets. Your API key never touches the browser.

- **In Development**: If the Edge Function is not deployed or the user is not logged in, the app falls back to using the local API key from Replit Secrets.

## Testing

After deployment, you need a valid user JWT to test:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/extract-receipt' \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageData": "https://example.com/receipt.jpg"}'
```

Note: `YOUR_USER_JWT_TOKEN` must be a valid JWT from a logged-in user, not the anon key.

## Security Benefits

- API key is stored server-side in Supabase secrets
- Never exposed in client-side code or browser
- **Requires authenticated users** - prevents unauthorized access
- Only your app's logged-in users can consume OpenAI quota
- Automatic key rotation possible via Supabase dashboard
