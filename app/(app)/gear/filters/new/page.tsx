import { Card, CardTitle } from "@/components/ui/card";
import { GearForm } from "@/components/forms/grinder-form";
import { getCurrentUser } from "@/lib/data/queries";

export default async function NewFilterPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6">
      <h1 className="mb-5 text-3xl font-bold">New Filter</h1>
      <Card>
        <CardTitle>Filter details</CardTitle>
        <GearForm gearType="filter" defaultVisibility={user.defaultVisibility} submitLabel="Save filter" />
      </Card>
    </div>
  );
}
