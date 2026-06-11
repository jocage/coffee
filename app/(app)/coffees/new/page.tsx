import { Card, CardTitle } from "@/components/ui/card";
import { CoffeeForm } from "@/components/forms/coffee-form";
import { getCurrentUser } from "@/lib/data/queries";

export default async function NewCoffeePage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6">
      <h1 className="mb-5 text-3xl font-bold">New Coffee</h1>
      <Card>
        <CardTitle>Coffee bean details</CardTitle>
        <CoffeeForm defaultVisibility={user.defaultVisibility} />
      </Card>
    </div>
  );
}
