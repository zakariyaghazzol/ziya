# Optional Supabase setup

Ziya remains fully usable without an account. Supabase only adds optional sign-in and synchronization for profile preferences, Today's Plate data, scan history, and local product corrections.

## 1. Create the project

Create a Supabase project, then open **Project Settings > API** (or the project **Connect** dialog) and copy the Project URL and publishable key or legacy anon public key.

Never use a secret key or legacy `service_role` key in the frontend.

## 2. Configure local environment variables

Copy `.env.example` to `.env.local` and add:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-public-key
```

The variable name remains `VITE_SUPABASE_ANON_KEY` for compatibility; a current Supabase publishable key is appropriate. `.env.local` is ignored by Git.

If either value is absent or still a placeholder, Ziya automatically stays in local-only mode. Scanner, reports, Today's Plate, History, profile preferences, and product corrections continue to work.

## 3. Create private user tables

Open the Supabase SQL Editor, review, and run these migrations in order:

1. `supabase/migrations/202607130001_profile_sync.sql`
2. `supabase/migrations/202607140001_regional_product_preferences.sql`

The first migration creates the profile, preference, Today's Plate, scan-history, and product-override tables. It enables Row Level Security and adds policies that require `auth.uid()` to match the row owner. The second adds product-region and ingredient-display preferences to the existing private profile row. No table grants anonymous users access.

## 4. Configure authentication

In **Authentication > Providers**:

1. Keep Email enabled for magic-link sign-in.
2. Optionally configure Google OAuth before using the Google button.
3. Apple can be enabled later; Ziya does not depend on it.

In **Authentication > URL Configuration**:

- Set the production Site URL to the deployed Ziya URL.
- Add `http://127.0.0.1:5173/` for local development.
- Add the production Vercel URL and any preview URLs you intentionally support.

Magic links and OAuth return to the current Ziya origin. An unlisted redirect URL will be rejected by Supabase.

## 5. Configure Vercel

Add both variables in **Vercel > Project Settings > Environment Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Apply them to the intended environments and redeploy. Vite embeds `VITE_` variables at build time, so a redeploy is required after changes.

## Sync behavior

- Sign-in is optional and never blocks scanning.
- The first signed-in session asks before syncing local data.
- Preference arrays are conservatively unioned by normalized key.
- Newer scalar profile settings win by `updatedAt`.
- Today's Plate entries and History use stable local IDs to avoid duplicate uploads.
- Product corrections use the newest `updatedAt` for each product key.
- Sign-out keeps the local copy and stops cloud requests.
- Network or table errors leave local data untouched and show a short sync status in Profile.

The frontend uses only the publishable/anon key. Row Level Security is the enforcement boundary; do not disable it for these tables.
