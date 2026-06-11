import { Card, CardTitle } from "@/components/ui/card";
import { GrinderForm } from "@/components/forms/grinder-form";
import { getCurrentUser } from "@/lib/data/queries";

export default async function NewGrinderPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6">
      <h1 className="mb-5 text-3xl font-bold">New Grinder</h1>
      <Card>
        <CardTitle>Grinder details</CardTitle>
        <GrinderForm defaultVisibility={user.defaultVisibility} />
      </Card>
    </div>
  );
}
