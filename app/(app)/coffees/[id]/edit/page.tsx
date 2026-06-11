import { notFound } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { CoffeeForm } from "@/components/forms/coffee-form";
import { getCoffeeById } from "@/lib/data/queries";

export default async function EditCoffeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coffee = await getCoffeeById(id);

  if (!coffee) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6">
      <h1 className="mb-5 text-3xl font-bold">Edit Coffee</h1>
      <Card>
        <CardTitle>Coffee bean details</CardTitle>
        <CoffeeForm coffee={coffee} submitLabel="Update coffee" />
      </Card>
    </div>
  );
}
