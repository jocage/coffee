import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getChallengeById, getClubBySlug } from "@/lib/data/queries";
import { joinClubAction } from "@/lib/server-actions/community";

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await getClubBySlug(slug);

  if (!club) {
    notFound();
  }

  const challenge = club.activeChallengeId ? await getChallengeById(club.activeChallengeId) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6">
      <Card className="overflow-hidden p-0">
        <div className="relative h-64">
          <Image src={club.coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/82 to-transparent" />
        </div>
        <div className="-mt-20 relative z-10 p-5">
          <Badge>{club.visibility}</Badge>
          <h1 className="serif mt-3 text-5xl">{club.name}</h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-muted)]">{club.description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <form action={joinClubAction}>
              <input type="hidden" name="clubId" value={club.id} />
              <input type="hidden" name="path" value={`/clubs/${club.slug}`} />
              <Button icon={<Users className="h-4 w-4" aria-hidden />}>Join club</Button>
            </form>
            {challenge ? (
              <Link href={`/challenges/${challenge.id}`}>
                <Button variant="secondary" icon={<Trophy className="h-4 w-4" aria-hidden />}>Open challenge</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </Card>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardTitle>Discussion</CardTitle>
          <div className="mt-4 rounded-[var(--radius-sm)] bg-white/5 p-4">
            <p className="text-sm font-semibold">What changed your cup most this week?</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Members are comparing bloom agitation, temperature drops and grinder settings.</p>
          </div>
        </Card>
        <Card>
          <CardTitle>Members</CardTitle>
          <p className="mt-4 text-3xl font-bold">{club.memberCount.toLocaleString()}</p>
          <p className="text-sm text-[var(--text-muted)]">baristas and home brewers</p>
        </Card>
      </div>
    </div>
  );
}
