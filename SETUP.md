# Setup — start to finish, no coding

You will do four things. Budget about 15 minutes.

1. Create a free Supabase project (your database + file storage).
2. Run one SQL file.
3. Create your admin login.
4. Put the site online.

---

## 1. Create the Supabase project

1. Go to **https://supabase.com** → *Start your project* → sign in with GitHub or email.
2. Click **New project**.
   - **Name:** anything, e.g. `birthday`
   - **Database Password:** let it generate one. You will not need it again, but save it somewhere.
   - **Region:** pick the one closest to you.
3. Wait ~2 minutes while it sets up.

---

## 2. Run the SQL file

1. In the left sidebar click **SQL Editor**.
2. Click **New query**.
3. Open the file `supabase/setup.sql` from this project, copy **everything**, paste it in.
4. Press **Run** (or Ctrl/Cmd + Enter).

You should see *Success. No rows returned.* That is correct — it just built your
tables, your security rules and your media storage.

---

## 3. Create your admin login

1. Sidebar → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter your email and a password you will remember.
3. **Tick “Auto Confirm User.”** (Important — otherwise you cannot log in.)
4. Click **Create user**.
5. Go back to **SQL Editor** → **New query**, and run this one line with your own
   email in it:

   ```sql
   select public.grant_admin('you@example.com');
   ```

   It should reply: *Done. you@example.com can now log in at /admin*

That email and password are now the only credentials that can edit the site.

> Optional but recommended: sidebar → **Authentication** → **Sign In / Providers**
> → turn **“Allow new users to sign up”** OFF. Then nobody can even create an
> account.

---

## 4. Connect the website

1. Sidebar → **Project Settings** (gear icon) → **API**.
2. Copy these two values:
   - **Project URL**
   - the **anon** **public** key (the long one labelled `anon`)
3. In this project, make a copy of `.env.example` and name it `.env.local`.
4. Paste your two values in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

**Never copy the `service_role` key.** The website does not use it, and it would
give away full access to your database.

### Try it on your computer

```bash
npm install
npm run dev
```

Open **http://localhost:3000** for the birthday site and
**http://localhost:3000/admin** to log in and start filling it in.

---

## 5. Put it online (Vercel — free)

1. Put this project on GitHub (GitHub Desktop is the easiest way if you have not
   used git before).
2. Go to **https://vercel.com** → sign in with GitHub → **Add New… → Project** →
   pick the repository.
3. Before clicking Deploy, open **Environment Variables** and add the same two:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |

4. Click **Deploy**. About a minute later you get a real URL like
   `https://her-birthday.vercel.app`.

Netlify and Cloudflare Pages work the same way — connect the repo, add those two
environment variables. Both detect Next.js automatically.

Send your friend the plain URL. Keep `/admin` to yourself.

---

## How to get into Admin Mode

- Go to **your-site.com/admin** and log in with the email and password from step 3.
- Once you are logged in, a small **✏️** button appears in the corner of the
  birthday site itself, so you can hop straight back into editing.
- Visitors never see that button, and `/admin` shows them only a login form.

Editing works fine from your phone — that is what it was designed for.

---

## Is it actually secure?

Yes, and not just by hiding buttons:

- Every table has **row level security**. Visitors are allowed to *read* the
  birthday content and nothing else. Attempting to write returns a `403` even
  with the public key.
- Uploading, replacing and deleting files requires being in the `admins` table.
- The `admins` table itself has no access policies at all, so it cannot be
  changed from the website — only from the Supabase SQL editor, which is behind
  your Supabase login.

---

## Troubleshooting

**“Almost there 💙” instead of the site**
`.env.local` is missing or misspelled. Restart `npm run dev` after editing it.
On Vercel, check the two environment variables and redeploy.

**“Invalid login credentials”**
The user was created without *Auto Confirm User*. Delete it in Authentication →
Users and create it again with the box ticked.

**Logged in, but it says “that account is not an admin yet”**
Run `select public.grant_admin('your@email.com');` in the SQL editor.

**An upload fails**
Files are capped at 200 MB. Phone videos can be larger than you expect — trim it
first. Photos are shrunk automatically before upload; videos are not.

**A Google Drive or Google Photos link will not display**
Google blocks direct embedding for most shared links. Download the file and
upload it instead — it is more reliable and it will load faster.

**HEIC photos from an iPhone**
Safari handles them. On Windows or Android the file uploads unchanged and may not
display. Easiest fix: in iPhone Settings → Camera → Formats, choose
*Most Compatible*, or share the photo to yourself first (that converts it to JPG).
