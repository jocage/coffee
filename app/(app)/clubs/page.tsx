import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getClubs } from "@/lib/data/queries";

export default async function ClubsPage() {
  const clubs = await getClubs();

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
      <div className="mb-5">
        <h1 className="text-3xl font-bold">Clubs</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Coffee groups, local communities and structured brewing experiments.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clubs.map((club) => (
          <Card key={club.id} className="overflow-hidden p-0">
            <div className="relative aspect-[16/9]">
              <Image src={club.coverUrl} alt="" fill sizes="420px" className="object-cover" />
            </div>
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="serif text-2xl">{club.name}</h2>
                <Badge>{club.visibility}</Badge>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{club.description}</p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm text-[var(--text-dim)]">
                  <Users className="h-4 w-4" aria-hidden />
                  {club.memberCount.toLocaleString()}
                </span>
                <Link href={`/clubs/${club.slug}`}>
                  <Button variant="secondary">Open</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
