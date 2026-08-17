# Birthday Website 💙

A mobile-first interactive birthday experience — five screens the visitor walks
through at their own pace — plus a private Admin Mode so you can change every
photo, video and word yourself, from your phone, without touching code.

```
INTRO  →  MEMORIES  →  SONG  →  LETTER  →  FINALE 🎉
```

**→ Start with [SETUP.md](./SETUP.md).** It is written step by step, no coding.

---

## What you can change, and where

Everything lives in Admin Mode at **/admin**. Nothing needs a code edit or a
redeploy — you save, and the site is updated.

| Tab | What's in it |
|---|---|
| **Website** | Friend's name, birthday date, intro heading and message, emoticon, button label, the character image/GIF, accent colour, Memories heading |
| **Memories** | Add photos and videos, captions, location, date, alt text, reorder, replace, delete |
| **Music** | Song title, artist, YouTube / Spotify / uploaded audio, the personal message, and the background music |
| **Letter** | The card image, greeting, the whole letter, sign-off |
| **Finale** | Birthday date, emojis, extra message, button labels, footer |

**Preview Website ↗** in the header opens the public site in a new tab.

---

## The five screens

**1. Intro** — the name, a round pastel frame with your character (a GIF works
beautifully), a cute emoticon, and the big blue Next button. Tap the character
for a small surprise.

**2. Memories** — a vertical scrapbook of photos *and* videos. Large rounded
cards, gentle scrapbook tilt, fade-up as they come into view. Tap a photo for
fullscreen (swipe or ← → to move between them, Esc to close). Press and hold a
photo to reveal its caption. Videos show a still frame and only load when tapped,
so a gallery of 50 items still opens fast.

**3. Song** — a YouTube or Spotify embed, or an audio file you upload, with the
title, artist and your personal note underneath.

**4. Letter** — your card image above a cream card holding the letter. Blank lines
become paragraphs; emojis are welcome.

**5. Finale** — the date, `💙 🎂 💙`, and **Celebrate 🎉**, which fires confetti
across the whole screen for a few seconds. Then **Start Over**.

A small 🔊 / 🔇 button sits in the top-right the whole way through. Browsers block
autoplay, so if the music can't start on its own it begins on the visitor's first
tap. It fades in and out rather than cutting.

---

## Under the hood

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for styling, **Framer Motion** for transitions
- **canvas-confetti** for the finale
- **Supabase** — Postgres for content, Storage for media, Auth for your login
- Deploys to **Vercel**, **Netlify** or **Cloudflare Pages**

```
src/
├── app/
│   ├── page.tsx              the public experience (reads the database)
│   ├── admin/page.tsx        Admin Mode (checks your session first)
│   └── globals.css           pastel backdrop + confetti dot pattern
├── components/
│   ├── BirthdayExperience    screen state, transitions, scroll memory
│   ├── BirthdayIntro / Memories / SongSection / BirthdayLetter / BirthdayFinale
│   ├── MediaCard             one photo or video in the gallery
│   ├── Lightbox              fullscreen viewer
│   ├── AudioControl          the speaker button
│   ├── ConfettiEffect        the confetti
│   └── admin/                login, tabs, forms, media manager
├── lib/
│   ├── supabase/             browser + server clients
│   ├── content.ts            reads the site from the database
│   ├── upload.ts             image compression, video posters, uploads
│   └── media.ts              YouTube / Spotify / Drive link handling
├── middleware.ts             keeps your admin session fresh
└── supabase/setup.sql        run once; builds everything
```

### Security

Two independent layers, not just hidden buttons:

1. `/admin` is checked on the server — no session, no editor.
2. **Row level security** in Postgres: visitors may read the birthday content and
   nothing more. Writes and uploads require being listed in the `admins` table,
   which itself is unreachable from the website. A write attempt with the public
   key returns `403`.

### Performance

- Photos are resized to max 1800px and recompressed **in your browser** before
  upload, so a 6 MB phone photo becomes a few hundred KB.
- Videos keep their original quality; a poster frame is generated automatically
  so the gallery doesn't have to load video data to show something.
- Everything below the fold is lazy-loaded.

### Accessibility

Real buttons and labels throughout, alt text on every image (editable per photo),
keyboard support in the lightbox, generous text sizes, visible focus rings, and
`prefers-reduced-motion` respected — animations and confetti calm right down.

---

## Running it locally without Supabase

Handy for a quick look before you set anything up:

```bash
npm run mock     # terminal 1 — a local stand-in for Supabase
npm run dev      # terminal 2
```

with `.env.local` pointing at it:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key
```

Log in at `/admin` with `admin@example.com` / `birthday123`.

This is for previewing on your own machine only — see `dev-tools/mock-supabase/`.
Deploy with real Supabase.

---

## Notes

- `public/audio/sample-loop.mp3` is a soft original music-box loop, included in
  case you want background music but don't have a file handy. Upload it in
  **Admin → Music → Background Music**. Nothing uses it until you do.
- The site starts completely empty on purpose. Every photo, video and word is
  yours to add.
