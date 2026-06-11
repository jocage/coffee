import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/form";
import type { SocialTargetType } from "@/lib/domain";
import { reportContentAction } from "@/lib/server-actions/social";

export function ReportForm({
  targetType,
  targetId,
  path
}: {
  targetType: SocialTargetType;
  targetId: string;
  path: string;
}) {
  return (
    <form action={reportContentAction} className="mt-4 grid gap-3">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="path" value={path} />
      <div>
        <Label htmlFor={`reason-${targetType}-${targetId}`}>Reason</Label>
        <Select id={`reason-${targetType}-${targetId}`} name="reason" defaultValue="spam">
          <option value="spam">Spam</option>
          <option value="harassment">Harassment</option>
          <option value="unsafe">Unsafe content</option>
          <option value="copyright">Copyright</option>
          <option value="other">Other</option>
        </Select>
      </div>
      <div>
        <Label htmlFor={`details-${targetType}-${targetId}`}>Details</Label>
        <Textarea id={`details-${targetType}-${targetId}`} name="details" placeholder="Optional context for moderators." />
      </div>
      <Button type="submit" variant="secondary" icon={<Flag className="h-4 w-4" aria-hidden />}>Report content</Button>
    </form>
  );
}
