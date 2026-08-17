'use client';

import { useCallback, useState } from 'react';
import type { Content } from '@/lib/types';
import { getBrowserClient } from '@/lib/supabase/client';
import AdminApp from './AdminApp';
import { Button, Card, Field, StatusLine, TextInput, type StatusKind } from './ui';

type Props = {
  signedIn: boolean;
  isAdmin: boolean;
  email: string | null;
  content: Content | null;
};

export default function AdminGate({ signedIn, isAdmin, email, content }: Props) {
  if (isAdmin && content) return <AdminApp initial={content} email={email} />;
  return <LoginScreen signedInButNotAdmin={signedIn} email={email} />;
}

function LoginScreen({
  signedInButNotAdmin,
  email: currentEmail,
}: {
  signedInButNotAdmin: boolean;
  email: string | null;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ kind: StatusKind; message: string }>({
    kind: 'idle',
    message: '',
  });

  const submit = useCallback(async () => {
    if (!email || !password) {
      setStatus({ kind: 'error', message: 'Enter your email and password.' });
      return;
    }
    setStatus({ kind: 'busy', message: 'Signing in…' });
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      setStatus({ kind: 'ok', message: 'Welcome back 💙' });
      window.location.reload();
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Could not sign in.',
      });
    }
  }, [email, password]);

  const signOut = useCallback(async () => {
    await getBrowserClient().auth.signOut();
    window.location.reload();
  }, []);

  return (
    <main className="mx-auto w-full max-w-[440px] px-5 py-14">
      <Card>
        <h1 className="font-display text-2xl font-extrabold text-[var(--accent)]">Admin</h1>
        <p className="mt-1.5 font-body text-sm text-[#8b83ad]">
          Only you can get in here. Visitors just see the birthday site.
        </p>

        {signedInButNotAdmin ? (
          <div className="mt-5 space-y-3">
            <p className="rounded-2xl bg-[#fdecef] px-4 py-3 font-body text-sm text-[#a3123a]">
              You are signed in as <strong>{currentEmail}</strong>, but that account is not an
              admin yet. Run this once in the Supabase SQL editor:
              <code className="mt-2 block break-all rounded-lg bg-white/70 px-2 py-1 text-xs">
                select public.grant_admin(&apos;{currentEmail}&apos;);
              </code>
            </p>
            <Button tone="neutral" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <Field label="Email">
              <TextInput
                type="email"
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>
            <Button type="submit" className="w-full" disabled={status.kind === 'busy'}>
              Sign in
            </Button>
            <StatusLine kind={status.kind} message={status.message} />
          </form>
        )}

        <p className="mt-6 font-body text-xs text-[#a49cc4]">
          Accounts are created in Supabase under Authentication → Users. See SETUP.md.
        </p>
      </Card>
    </main>
  );
}
