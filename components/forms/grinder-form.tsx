import { saveGearAction, updateGearAction } from "@/lib/server-actions/gear";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { MediaUploadField } from "@/components/media/media-upload-field";
import type {
  DripperCatalogItem,
  GearItem,
  GearType,
  GrinderCatalogItem,
  Visibility
} from "@/lib/domain";

const methods = ["V60", "Origami", "Kalita", "AeroPress", "Espresso", "French Press", "Switch"];
type GrinderDefaults = Pick<
  GrinderCatalogItem,
  "name" | "brand" | "model" | "grinderDrive" | "burrType" | "filterRange" | "notes" | "imageUrl"
>;
type DripperDefaults = Pick<
  DripperCatalogItem,
  | "name"
  | "brand"
  | "model"
  | "material"
  | "size"
  | "brewSpeed"
  | "compatibleFilters"
  | "notes"
  | "imageUrl"
>;

export function GearForm({
  gear,
  gearType,
  grinderDefaults,
  dripperDefaults,
  defaultVisibility = "private",
  submitLabel = "Save gear"
}: {
  gear?: GearItem;
  gearType?: Extract<GearType, "grinder" | "dripper" | "filter">;
  grinderDefaults?: GrinderDefaults;
  dripperDefaults?: DripperDefaults;
  defaultVisibility?: Visibility;
  submitLabel?: string;
}) {
  const resolvedType =
    gearType ?? (gear?.type === "dripper" || gear?.type === "filter" ? gear.type : "grinder");
  const title =
    resolvedType === "grinder" ? "grinder" : resolvedType === "dripper" ? "dripper" : "filter";

  return (
    <form
      action={gear ? updateGearAction : saveGearAction}
      className="mt-5 grid gap-4 md:grid-cols-2"
    >
      {gear ? <input type="hidden" name="id" value={gear.id} /> : null}
      <input type="hidden" name="type" value={resolvedType} />
      <MediaUploadField
        entityType="gear"
        label={`Add ${title} photo`}
        urlFieldName="imageUrl"
        initialUrl={gear?.imageUrl ?? grinderDefaults?.imageUrl ?? dripperDefaults?.imageUrl}
        className="md:col-span-2"
      />
      <Field
        id="name"
        label="Name"
        placeholder={
          resolvedType === "grinder"
            ? "Comandante C40"
            : resolvedType === "dripper"
              ? "Origami Air S"
              : "Cafec Abaca"
        }
        defaultValue={gear?.name ?? grinderDefaults?.name ?? dripperDefaults?.name}
      />
      <Field
        id="brand"
        label="Brand"
        placeholder={
          resolvedType === "grinder"
            ? "Comandante"
            : resolvedType === "dripper"
              ? "Origami"
              : "Cafec"
        }
        defaultValue={gear?.brand ?? grinderDefaults?.brand ?? dripperDefaults?.brand}
      />
      <Field
        id="model"
        label="Model"
        placeholder={
          resolvedType === "grinder" ? "C40 MK4" : resolvedType === "dripper" ? "Air S" : "Abaca 02"
        }
        defaultValue={gear?.model ?? grinderDefaults?.model ?? dripperDefaults?.model}
      />
      {resolvedType === "grinder" ? <GrinderFields defaults={grinderDefaults} /> : null}
      {resolvedType === "dripper" ? <DripperFields defaults={dripperDefaults} /> : null}
      {resolvedType === "filter" ? <FilterFields /> : null}
      <div className="md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder={`Notes about this ${title}.`}
          defaultValue={gear?.notes ?? grinderDefaults?.notes ?? dripperDefaults?.notes}
        />
      </div>
      <div className={resolvedType === "filter" ? "hidden" : ""}>
        <Label htmlFor="defaultForMethod">Default for</Label>
        <Select
          id="defaultForMethod"
          name="defaultForMethod"
          defaultValue={gear?.defaultForMethod ?? ""}
        >
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
        <Select
          id="visibility"
          name="visibility"
          defaultValue={gear?.visibility ?? defaultVisibility}
        >
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
  grinderDefaults,
  defaultVisibility = "private",
  submitLabel = "Save grinder"
}: {
  gear?: GearItem;
  grinderDefaults?: GrinderDefaults;
  defaultVisibility?: Visibility;
  submitLabel?: string;
}) {
  return (
    <GearForm
      gear={gear}
      gearType="grinder"
      grinderDefaults={grinderDefaults}
      defaultVisibility={defaultVisibility}
      submitLabel={submitLabel}
    />
  );
}

function GrinderFields({ defaults }: { defaults?: GrinderDefaults }) {
  return (
    <>
      <div>
        <Label htmlFor="grinderDrive">Drive</Label>
        <Select
          id="grinderDrive"
          name="grinderDrive"
          defaultValue={defaults?.grinderDrive ?? "manual"}
        >
          <option value="manual">Manual</option>
          <option value="electric">Electric</option>
        </Select>
      </div>
      <Field
        id="burrType"
        label="Burr type"
        placeholder="Stainless steel"
        defaultValue={defaults?.burrType}
      />
      <Field
        id="filterRange"
        label="Filter range"
        placeholder="40-45 clicks"
        defaultValue={defaults?.filterRange}
      />
    </>
  );
}

function DripperFields({ defaults }: { defaults?: DripperDefaults }) {
  return (
    <>
      <Field
        id="material"
        label="Material"
        placeholder="Resin, ceramic, glass"
        defaultValue={defaults?.material}
      />
      <Field id="size" label="Size" placeholder="01, 02, S, M" defaultValue={defaults?.size} />
      <Field
        id="brewSpeed"
        label="Brew speed"
        placeholder="Fast, balanced, slow"
        defaultValue={defaults?.brewSpeed}
      />
      <Field
        id="compatibleFilters"
        label="Compatible filters"
        placeholder="V60 01, Kalita 155"
        defaultValue={defaults?.compatibleFilters}
      />
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

function Field({
  id,
  label,
  placeholder,
  defaultValue
}: {
  id: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} placeholder={placeholder} defaultValue={defaultValue} />
    </div>
  );
}
