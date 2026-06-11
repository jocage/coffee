import { saveGearAction, updateGearAction } from "@/lib/server-actions/gear";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { MediaUploadField } from "@/components/media/media-upload-field";
import type { GearItem, GearType, Visibility } from "@/lib/domain";

const methods = ["V60", "Origami", "Kalita", "AeroPress", "Espresso", "French Press", "Switch"];

export function GearForm({
  gear,
  gearType,
  defaultVisibility = "private",
  submitLabel = "Save gear"
}: {
  gear?: GearItem;
  gearType?: Extract<GearType, "grinder" | "dripper" | "filter">;
  defaultVisibility?: Visibility;
  submitLabel?: string;
}) {
  const resolvedType = gearType ?? (gear?.type === "dripper" || gear?.type === "filter" ? gear.type : "grinder");
  const title = resolvedType === "grinder" ? "grinder" : resolvedType === "dripper" ? "dripper" : "filter";

  return (
    <form action={gear ? updateGearAction : saveGearAction} className="mt-5 grid gap-4 md:grid-cols-2">
      {gear ? <input type="hidden" name="id" value={gear.id} /> : null}
      <input type="hidden" name="type" value={resolvedType} />
      <MediaUploadField entityType="gear" label={`Add ${title} photo`} urlFieldName="imageUrl" initialUrl={gear?.imageUrl} className="md:col-span-2" />
      <Field id="name" label="Name" placeholder={resolvedType === "grinder" ? "Comandante C40" : resolvedType === "dripper" ? "Origami Air S" : "Cafec Abaca"} defaultValue={gear?.name} />
      <Field id="brand" label="Brand" placeholder={resolvedType === "grinder" ? "Comandante" : resolvedType === "dripper" ? "Origami" : "Cafec"} defaultValue={gear?.brand} />
      <Field id="model" label="Model" placeholder={resolvedType === "grinder" ? "C40 MK4" : resolvedType === "dripper" ? "Air S" : "Abaca 02"} defaultValue={gear?.model} />
      {resolvedType === "grinder" ? <GrinderFields /> : null}
      {resolvedType === "dripper" ? <DripperFields /> : null}
      {resolvedType === "filter" ? <FilterFields /> : null}
      <div className="md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" placeholder={`Notes about this ${title}.`} defaultValue={gear?.notes} />
      </div>
      <div className={resolvedType === "filter" ? "hidden" : ""}>
        <Label htmlFor="defaultForMethod">Default for</Label>
        <Select id="defaultForMethod" name="defaultForMethod" defaultValue={gear?.defaultForMethod ?? ""}>
          <option value="">Not default</option>
          {methods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="visibility">Visibility</Label>
        <Select id="visibility" name="visibility" defaultValue={gear?.visibility ?? defaultVisibility}>
          <option value="private">Private</option>
          <option value="followers">Followers</option>
          <option value="unlisted">Unlisted</option>
          <option value="public">Public</option>
        </Select>
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}

export function GrinderForm({
  gear,
  defaultVisibility = "private",
  submitLabel = "Save grinder"
}: {
  gear?: GearItem;
  defaultVisibility?: Visibility;
  submitLabel?: string;
}) {
  return <GearForm gear={gear} gearType="grinder" defaultVisibility={defaultVisibility} submitLabel={submitLabel} />;
}

function GrinderFields() {
  return (
    <>
      <div>
        <Label htmlFor="grinderDrive">Drive</Label>
        <Select id="grinderDrive" name="grinderDrive" defaultValue="manual">
          <option value="manual">Manual</option>
          <option value="electric">Electric</option>
        </Select>
      </div>
      <Field id="burrType" label="Burr type" placeholder="Stainless steel" />
      <Field id="filterRange" label="Filter range" placeholder="40-45 clicks" />
    </>
  );
}

function DripperFields() {
  return (
    <>
      <Field id="material" label="Material" placeholder="Resin, ceramic, glass" />
      <Field id="size" label="Size" placeholder="01, 02, S, M" />
      <Field id="brewSpeed" label="Brew speed" placeholder="Fast, balanced, slow" />
      <Field id="compatibleFilters" label="Compatible filters" placeholder="V60 01, Kalita 155" />
    </>
  );
}

function FilterFields() {
  return (
    <>
      <Field id="size" label="Size" placeholder="01, 02, 155" />
      <Field id="material" label="Material / paper type" placeholder="Abaca, bleached paper" />
      <Field id="compatibleDrippers" label="Compatible drippers" placeholder="V60 02, Origami M" />
    </>
  );
}

function Field({ id, label, placeholder, defaultValue }: { id: string; label: string; placeholder: string; defaultValue?: string }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} placeholder={placeholder} defaultValue={defaultValue} />
    </div>
  );
}
