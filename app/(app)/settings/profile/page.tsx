import { saveProfileAction } from "@/lib/server-actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { MediaUploadField } from "@/components/media/media-upload-field";
import { getCurrentUser, getMyGear } from "@/lib/data/queries";

const methods = ["V60", "Origami", "Kalita", "AeroPress", "Espresso", "French Press", "Switch"];

export default async function SettingsProfilePage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const [user, gear] = await Promise.all([getCurrentUser(), getMyGear()]);
  const grinders = gear.filter((item) => item.type === "grinder");
  const drippers = gear.filter((item) => item.type === "dripper");
  const filters = gear.filter((item) => item.type === "filter");

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
      <h1 className="mb-5 text-3xl font-bold">Profile Settings</h1>
      {params.saved ? (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/5 px-4 py-3 text-sm text-[var(--olive)]"
        >
          Profile settings saved.
        </p>
      ) : null}
      <Card>
        <CardTitle>Public profile</CardTitle>
        <form action={saveProfileAction} className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <MediaUploadField
              entityType="avatar"
              label="Update avatar"
              urlFieldName="avatarUrl"
              assetFieldName="avatarAssetId"
              initialUrl={user.avatarUrl}
            />
            <MediaUploadField
              entityType="cover"
              label="Update cover"
              urlFieldName="coverUrl"
              assetFieldName="coverAssetId"
              initialUrl={user.coverUrl}
            />
          </div>
          <div>
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" name="displayName" defaultValue={user.displayName} />
          </div>
          <div>
            <Label htmlFor="handle">Handle</Label>
            <Input id="handle" name="handle" defaultValue={user.handle} />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" defaultValue={user.bio} />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={user.location} />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              defaultValue={user.website}
              placeholder="https://example.com"
            />
          </div>
          <fieldset>
            <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Favorite methods
            </legend>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {methods.map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-white/5 p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    name="favoriteMethods"
                    value={method}
                    defaultChecked={user.favoriteMethods.includes(method as never)}
                    className="accent-[var(--accent)]"
                  />
                  {method}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <Label htmlFor="defaultVisibility">Default privacy</Label>
            <Select
              id="defaultVisibility"
              name="defaultVisibility"
              defaultValue={user.defaultVisibility}
            >
              <option value="private">Private</option>
              <option value="followers">Followers</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="defaultGrinderId">Default grinder</Label>
              <Select
                id="defaultGrinderId"
                name="defaultGrinderId"
                defaultValue={user.defaultGrinderId ?? ""}
              >
                <option value="">None</option>
                {grinders.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="defaultDripperId">Default dripper</Label>
              <Select
                id="defaultDripperId"
                name="defaultDripperId"
                defaultValue={user.defaultDripperId ?? ""}
              >
                <option value="">None</option>
                {drippers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="defaultFilterId">Default filter</Label>
              <Select
                id="defaultFilterId"
                name="defaultFilterId"
                defaultValue={user.defaultFilterId ?? ""}
              >
                <option value="">None</option>
                {filters.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Button type="submit">Save profile</Button>
        </form>
      </Card>
    </div>
  );
}
