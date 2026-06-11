export type ActionResult<T = null> =
  | { ok: true; data: T; message?: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; message: string };

export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
