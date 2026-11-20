# Project Architecture Rules

- Keep AI prompts and gateway calls inside Supabase Edge Functions; the browser should invoke those functions so gateway credentials stay server-side.