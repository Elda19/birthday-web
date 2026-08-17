import AdminGate from '@/components/admin/AdminGate';
import SetupNotice from '@/components/SetupNotice';
import { fetchContent } from '@/lib/content';
import { getServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!isSupabaseConfigured) return <SetupNotice />;

  /* First gate: the server checks the session cookie and whether that user is
     actually in the admins table. The second gate is row level security in the
     database, which blocks writes even if someone bypasses this page. */
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data } = await supabase.rpc('is_admin');
    isAdmin = data === true;
  }

  const content = isAdmin ? await fetchContent() : null;

  return (
    <AdminGate
      signedIn={Boolean(user)}
      isAdmin={isAdmin}
      email={user?.email ?? null}
      content={content}
    />
  );
}
