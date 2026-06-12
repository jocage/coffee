import { savePrivacyAction } from "@/lib/server-actions/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/form";
import { getCurrentUser } from "@/lib/data/queries";

export default async function SettingsPrivacyPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Privacy Settings</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Control defaults for new content and what appears on your public profile.
          </p>
        </div>
        <Badge>{user.defaultVisibility} by default</Badge>
      </div>

      {params.saved ? (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-[var(--olive)]"
        >
          Privacy settings saved.
        </p>
      ) : null}

      <Card>
        <CardTitle>Defaults and access</CardTitle>
        <form action={savePrivacyAction} className="mt-5 grid gap-5">
          <div>
            <Label htmlFor="defaultVisibility">Default content visibility</Label>
            <Select id="defaultVisibility" name="defaultVisibility" defaultValue={user.defaultVisibility}>
              <option value="private">Private</option>
              <option value="followers">Followers</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="defaultCommentPolicy">Who can comment</Label>
            <Select
              id="defaultCommentPolicy"
              name="defaultCommentPolicy"
              defaultValue={user.defaultCommentPolicy}
            >
              <option value="public">Anyone</option>
              <option value="followers">Followers</option>
              <option value="disabled">No one</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="messagePolicy">Who can message</Label>
            <Select id="messagePolicy" name="messagePolicy" defaultValue={user.messagePolicy}>
              <option value="public">Anyone</option>
              <option value="followers">Followers</option>
              <option value="none">No one</option>
            </Select>
          </div>

          <fieldset>
            <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Public profile
            </legend>
            <div className="grid gap-3">
              <label className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-3 text-sm">
                <input
                  type="checkbox"
                  name="showGearOnProfile"
                  defaultChecked={user.showGearOnProfile}
                  className="mt-1 accent-[var(--accent)]"
                />
                <span>
                  <strong className="block">Show gear on profile</strong>
                  <span className="text-[var(--text-muted)]">Display your grinders, drippers and filters publicly.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 p-3 text-sm">
                <input
                  type="checkbox"
                  name="showCoffeeOnProfile"
                  defaultChecked={user.showCoffeeOnProfile}
                  className="mt-1 accent-[var(--accent)]"
                />
                <span>
                  <strong className="block">Show coffee on profile</strong>
                  <span className="text-[var(--text-muted)]">Display your bean collection publicly.</span>
                </span>
              </label>
            </div>
          </fieldset>

          <Button type="submit">Save privacy</Button>
        </form>
      </Card>
    </div>
  );
}
