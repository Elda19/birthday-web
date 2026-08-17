# Mock Supabase (local preview only)

This is a tiny stand-in for Supabase so you can run the website on your own
computer without creating a Supabase project. It is **not** for deployment -
there is no real security here and the data lives in a local folder.

```bash
npm run mock          # terminal 1
npm run dev           # terminal 2
```

With `.env.local` set to:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key
```

Admin login: `admin@example.com` / `birthday123`

For the real thing, follow SETUP.md instead.
