# Environment Configuration

This project uses Vite environment variables for runtime configuration. Do NOT hardcode Supabase credentials in source.

## Required variables

Create `.env.local` for local dev, `.env.staging` for staging, and `.env.production` for prod:

- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — the public anon key

Optionally for local dev only:
- `VITE_DEFAULT_LANGUAGE` — default UI language
- `VITE_DEFAULT_TENANT_SLUG` — default tenant slug for local flows

## Usage

The Supabase client reads the values via `import.meta.env` in `src/integrations/supabase/client.ts`.

```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
```

## Native builds

For Android/iOS builds, ensure these env vars are available at build time:
- Android Gradle: export env before `./gradlew assemble...` or inject via `gradle.properties`/`buildConfigField`
- iOS: use `.xcconfig` files or Xcode build settings to pass env at compile time

## Secrets

- The anon key is public, but treat environment separation strictly.
- Admin/service role keys must NEVER be embedded in the app; only used in secure server contexts.

