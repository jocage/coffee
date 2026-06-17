import { OnboardingStepper } from "@/components/auth/onboarding-stepper";
import { getClubs, getCurrentUser, getProfiles } from "@/lib/data/queries";

export default async function OnboardingPage() {
  const [user, profiles, clubs] = await Promise.all([getCurrentUser(), getProfiles(), getClubs()]);
  const suggestedProfiles = profiles.filter((profile) => profile.id !== user.id).slice(0, 3);
  const suggestedClubs = clubs.slice(0, 3);

  return (
    <OnboardingStepper
      user={user}
      suggestedProfiles={suggestedProfiles}
      suggestedClubs={suggestedClubs}
    />
  );
}
