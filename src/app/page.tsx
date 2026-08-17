import BirthdayExperience from '@/components/BirthdayExperience';
import SetupNotice from '@/components/SetupNotice';
import { fetchContent } from '@/lib/content';
import { getServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

/* Always read the latest content, so a save in Admin Mode shows up straight
   away on every device without a rebuild. */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** The little pencil is rendered only for a logged-in admin. A normal visitor
 *  gets no hint that an editor exists. */
async function viewerIsAdmin() {
  if (!isSupabaseConfigured) return false;
  try {
    const supabase = getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.rpc('is_admin');
    return data === true;
  } catch {
    return false;
  }
}

export default async function Page() {
  const [content, isAdmin] = await Promise.all([fetchContent(), viewerIsAdmin()]);
  if (content.notConfigured) return <SetupNotice />;
  return <BirthdayExperience content={content} showEditButton={isAdmin} />;
}
