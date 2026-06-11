import type { UserProfile, Visibility } from "@/lib/domain";

type Viewer = Pick<UserProfile, "id"> | null;

type VisibilityContext = {
  ownerId: string;
  viewer: Viewer;
  isFollower?: boolean;
};

export function canReadVisibility(visibility: Visibility, context: VisibilityContext): boolean {
  if (context.viewer?.id === context.ownerId) {
    return true;
  }

  if (visibility === "public" || visibility === "unlisted") {
    return true;
  }

  if (visibility === "followers") {
    return Boolean(context.viewer && context.isFollower);
  }

  return false;
}

export function canRemix(visibility: Visibility, remixPolicy: string, isOwner: boolean): boolean {
  if (isOwner) {
    return true;
  }

  return (visibility === "public" || visibility === "unlisted") && remixPolicy !== "none";
}
