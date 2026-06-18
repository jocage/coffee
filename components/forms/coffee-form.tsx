import { saveCoffeeAction, updateCoffeeAction } from "@/lib/server-actions/coffee";
import { MobileCoffeeWizard } from "@/components/forms/mobile-coffee-wizard";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { MediaUploadField } from "@/components/media/media-upload-field";
import type { CoffeeBean, Visibility } from "@/lib/domain";

export function CoffeeForm({
  coffee,
  defaultVisibility = "private",
  submitLabel = "Save coffee"
}: {
  coffee?: CoffeeBean;
  defaultVisibility?: Visibility;
  submitLabel?: string;
}) {
  const action = coffee ? updateCoffeeAction : saveCoffeeAction;

  return (
    <>
      <MobileCoffeeWizard
        coffee={coffee}
        action={action}
        defaultVisibility={defaultVisibility}
        submitLabel={submitLabel}
      />
      <Card className="hidden lg:block">
        <CardTitle>Coffee bean details</CardTitle>
        <form action={action} className="mt-5 grid gap-4 md:grid-cols-2">
          {coffee ? <input type="hidden" name="id" value={coffee.id} /> : null}
          <MediaUploadField
            entityType="coffee"
            label="Add coffee bag photo"
            urlFieldName="imageUrl"
            initialUrl={coffee?.imageUrl}
            className="md:col-span-2"
          />
          <InputGroup
            id="name"
            label="Name"
            placeholder="Ethiopia Shakiso"
            defaultValue={coffee?.name}
          />
          <InputGroup
            id="roaster"
            label="Roaster"
            placeholder="Kurasa Kyoto"
            defaultValue={coffee?.roaster}
          />
          <InputGroup
            id="origin"
            label="Origin"
            placeholder="Yirgacheffe, Ethiopia"
            defaultValue={coffee?.origin}
          />
          <InputGroup
            id="process"
            label="Process"
            placeholder="Washed"
            defaultValue={coffee?.process}
          />
          <div>
            <Label htmlFor="roastLevel">Roast level</Label>
            <Select id="roastLevel" name="roastLevel" defaultValue={coffee?.roastLevel ?? "light"}>
              <option value="light">Light</option>
              <option value="medium-light">Medium-light</option>
              <option value="medium">Medium</option>
              <option value="medium-dark">Medium-dark</option>
              <option value="dark">Dark</option>
            </Select>
          </div>
          <InputGroup
            id="rating"
            label="Rating"
            placeholder="4.8"
            defaultValue={coffee?.rating ? String(coffee.rating) : undefined}
          />
          <div className="md:col-span-2">
            <Label htmlFor="flavorNotes">Flavor notes</Label>
            <Textarea
              id="flavorNotes"
              name="flavorNotes"
              placeholder="Jasmine, peach, bergamot"
              defaultValue={coffee?.flavorNotes.join(", ")}
            />
          </div>
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              id="visibility"
              name="visibility"
              defaultValue={coffee?.visibility ?? defaultVisibility}
            >
              <option value="private">Private</option>
              <option value="followers">Followers</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </Select>
          </div>
          <Button type="submit">{submitLabel}</Button>
        </form>
      </Card>
    </>
  );
}

function InputGroup({
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
