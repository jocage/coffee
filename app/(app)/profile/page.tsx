import { ProfileView } from "@/components/social/profile-view";
import { getProfileContent } from "@/lib/data/queries";

export default async function ProfilePage() {
  const content = await getProfileContent();

  if (!content) return null;

  return <ProfileView {...content} />;
}
