# Sherlynda — Pink & White Glass Portfolio

Next.js App Router + React portfolio with a light pink/white glass design, floating navigation, responsive layouts, scroll reveals, a multi-photo gallery, and certificates. The former music-player bar has been removed.

## Local development

Node.js 22 or newer:

    npm ci
    npm run dev

Open http://localhost:3000 and http://localhost:3000/dashboard/.

    npm test
    npm run build

The static build is emitted to out/. GitHub Actions deploys it to GitHub Pages. NEXT_PUBLIC_BASE_PATH supports a project subpath; a custom domain uses the root. See DOMAIN.md for sherlyndaps.my.id / Sumopod.

## Admin authentication

/dashboard/ requires Supabase email/password authentication. The client validates the user through auth.getUser and matches the configured confirmed admin ID and email. It does not grant access based on a local login flag. The password is not stored in the repository or browser application bundle. data/auth-config.json contains the public project URL, publishable key, and public admin identifier only. Never add a secret/service_role key to this file.

The admin account is created from the Supabase dashboard. Database access is separately enforced by Row Level Security: only identities listed in portfolio_admins may publish content or upload media. Client-side UI checks are not the database authorization boundary.

## Content studio

- Edit the profile, education, internship, organization, and contact details.
- Add up to 100 gallery photos, select multiple files at once, and edit each title/description.
- Reorder or remove gallery entries.
- Add up to 100 certificates with title, issuer, date, description, credential URL, and an image or PDF.
- JPG/PNG/WebP and PDF files may be up to 10 MB. Images are compressed to a maximum 1200-pixel longest side before uploading.
- Preview draft changes immediately. Click Publikasikan to save the public portfolio to Supabase; visitors receive it on their next page load without a Git rebuild.
- Download or restore a JSON backup. Earlier three-photo backups remain supported.

Drafts are stored in the current browser. Published content is shared across devices. The public site uses data/portfolio.json as a static/offline fallback when the backend cannot be reached. Media is stored in the public portfolio-media bucket for use on the public portfolio. Removing an entry removes its reference from the next published profile; it does not automatically delete the underlying storage object, so existing published references are not broken while editing.

## Database

The migration is recorded in supabase/migrations/20261031_portfolio_content.sql. It creates:

- portfolio_admins: membership visible only to the authenticated identity itself; no browser write grant.
- portfolio_content: public read of the main published profile; insert/update restricted to admins.
- portfolio-media: a public media bucket, with uploads restricted to admins under their own user-ID folder.

Admin membership is provisioned by the database owner after creating and confirming the Auth user. Public signup alone grants no content or storage write access. The studio has no signup interface.

## Verification

Tests cover server-validated admin identity, failure-closed access, rejection of secret client keys, legacy backup compatibility, many-photo descriptions, certificate metadata and link safety, contact links, and base-path configuration. The live login and admin membership were checked without publishing test content.