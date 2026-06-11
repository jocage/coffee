import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { getCurrentUser } from "@/lib/data/queries";
import { AuthRequiredError } from "@/lib/data/repositories";

export default async function UiKitPage() {
  try {
    await getCurrentUser();
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/sign-in?next=/dev/ui");
    }
    throw error;
  }

  return (
    <main className="mx-auto grid max-w-4xl gap-5 px-5 py-10">
      <h1 className="text-3xl font-bold">UI Kit</h1>
      <Card>
        <CardTitle>Buttons</CardTitle>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </Card>
      <Card>
        <CardTitle>Fields</CardTitle>
        <div className="mt-4 grid gap-4">
          <div><Label>Input</Label><Input placeholder="Placeholder" /></div>
          <div><Label>Select</Label><Select><option>V60</option></Select></div>
          <div><Label>Textarea</Label><Textarea placeholder="Notes" /></div>
          <div className="flex gap-2"><Badge>Public</Badge><Badge>V60</Badge><Badge>Medium-fine</Badge></div>
        </div>
      </Card>
    </main>
  );
}
