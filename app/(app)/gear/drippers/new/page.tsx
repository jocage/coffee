import { Card, CardTitle } from "@/components/ui/card";
import { GearForm } from "@/components/forms/grinder-form";
import { getCurrentUser } from "@/lib/data/queries";

export default async function NewDripperPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6">
      <h1 className="mb-5 text-3xl font-bold">New Dripper</h1>
      <Card>
        <CardTitle>Dripper details</CardTitle>
        <GearForm gearType="dripper" defaultVisibility={user.defaultVisibility} submitLabel="Save dripper" />
      </Card>
    </div>
  );
}
