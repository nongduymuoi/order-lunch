import type { FormState } from "@/lib/form-state";

export function FormMessage({ state }: { state: FormState }) {
  if (state?.error) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
        {state.error}
      </p>
    );
  }
  if (state?.success) {
    return (
      <p className="rounded-xl border border-royal-200 bg-royal-50 px-4 py-2.5 text-sm text-royal-700">
        {state.success}
      </p>
    );
  }
  return null;
}
