# Photo contributions — smoke-test checklist (run on your laptop)

*The cloud session can't reach the database or file storage, so this flow has to be
tested where you have the keys: your laptop, against the live Supabase project. Work
top to bottom — each step says what you should see if it's working.*

## 0. One-time setup (do these first)
- [ ] **Apply the migration.** In the project folder: `supabase db push`. This creates
      the `bag_photo` table **and** the `bag-photos` storage bucket automatically.
- [ ] **Confirm the bucket exists.** Supabase dashboard → Storage → you should see a
      bucket named **`bag-photos`** marked **Public**.
- [ ] **Service-role key is set** in `.env.local` (`SUPABASE_SERVICE_ROLE_KEY`). The
      admin review queue, trusted auto-publish, and the "Most Wanted" board all need it.
- [ ] **Run the app locally** (`npm run dev`) and log in with a test account.

## 1. Submit a photo (the everyday path)
- [ ] Open any bag page. Scroll to the **Photos** section (also in the jump-nav).
- [ ] With no photos yet, you should see the **"This bag is a rare find."** empty state.
- [ ] Click **Add a photo** → choose an image, add a caption, **check the ownership box**,
      Submit.
- [ ] Try submitting **without** checking the box → it should refuse with a clear message.
- [ ] After a successful submit you should see **"in the review queue"** (because a normal
      account isn't a trusted tier yet).

## 2. Moderate it (admin)
- [ ] As your **admin** account, go to **/admin → Photos** (`/admin/photos`).
- [ ] Your submitted photo should appear under **Pending**, with the bag name + your byline.
- [ ] Click **Approve** → reload the bag page → the photo now shows in the gallery with
      your **@handle** byline.
- [ ] Back in the queue, on another photo click **★ Feature** → on the bag page that photo
      should become the **hero image** at the top, and show a **★ Featured** tag in the gallery.
- [ ] Click **Reject** on a third → it disappears from the public gallery.

## 3. Trusted auto-publish (the Authenticator reward)
- [ ] Grant a test account the trusted flag (Supabase SQL editor):
      `update profile set is_authenticator = true where id = '<that-user-id>';`
- [ ] Log in as that account, submit a photo → you should see **"your photo is live"**
      immediately (it skips the queue), and it appears in the gallery right away.

## 4. Points & tiers
- [ ] On **/profile**, the **Contributor tier** card should reflect your activity —
      points went up when a photo was approved, and the tier label moved
      (e.g. Collector → **Connoisseur** once you have an approved photo).
- [ ] Reject or delete a previously-approved photo → points should go back down
      (anti-gaming reversal).

## 5. Most Wanted board
- [ ] Visit **/photos/most-wanted**. With some closet/"want" data in the DB you should see
      a demand-ranked list of bags that have no photo yet, each linking to its bag page.
      (Empty state is expected if there's no demand data or the service-role key is missing.)

## If something's off
- **Gallery/upload do nothing / errors about a missing table** → migration 0016 didn't apply.
- **Admin queue always empty** → service-role key not set, or your admin flag isn't set
  (`update profile set is_admin = true where id = '<you>';`).
- **Upload fails** → check the bucket is **Public** and the storage policies from 0016 applied.
