/** Shown only when the two Supabase environment variables are missing, so the
 *  site explains itself instead of showing a stack trace. */
export default function SetupNotice() {
  return (
    <main className="mx-auto w-full max-w-[520px] px-6 py-16">
      <div className="rounded-[26px] bg-white/85 p-7 shadow-card ring-1 ring-white/70">
        <h1 className="font-display text-2xl font-extrabold text-[var(--accent)]">
          Almost there 💙
        </h1>
        <p className="mt-3 font-body text-[0.95rem] leading-relaxed text-[#544c7c]">
          The website is built, it just needs to be connected to your Supabase
          project. Open <span className="font-semibold">SETUP.md</span> and follow
          the three steps - it takes about ten minutes and there is no coding.
        </p>
        <ol className="mt-4 space-y-2 pl-5 font-body text-sm text-[#6d6494]">
          <li className="list-decimal">Create a free Supabase project.</li>
          <li className="list-decimal">
            Paste <span className="font-semibold">supabase/setup.sql</span> into the
            SQL editor and press Run.
          </li>
          <li className="list-decimal">
            Put your Project URL and anon key into{' '}
            <span className="font-semibold">.env.local</span>.
          </li>
        </ol>
      </div>
    </main>
  );
}
