import { notFound } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { GearForm } from "@/components/forms/grinder-form";
import { getGearItemById } from "@/lib/data/queries";

export default async function EditGearPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gear = await getGearItemById(slug);

  if (!gear) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6">
      <h1 className="mb-5 text-3xl font-bold">Edit Gear</h1>
      <Card>
        <CardTitle>Gear details</CardTitle>
        <GearForm gear={gear} submitLabel="Update gear" />
      </Card>
    </div>
  );
}
