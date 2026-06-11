import { notFound } from "next/navigation";
import { ProfileView } from "@/components/social/profile-view";
import { getProfileContent } from "@/lib/data/queries";

export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const content = await getProfileContent(handle);

  if (!content) {
    notFound();
  }

  return <ProfileView {...content} />;
}
