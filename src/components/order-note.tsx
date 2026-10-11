import { toggleNoteAck } from "@/app/actions/admin";
import { SubmitButton } from "./submit-button";

export function OrderNote({
  orderId,
  note,
  acknowledged,
  canAck,
}: {
  orderId: number;
  note: string;
  acknowledged: boolean;
  canAck: boolean;
}) {
  return (
    <div
      className={`mt-2 flex items-start gap-2 rounded-xl px-3 py-2 text-sm ring-1 ${
        acknowledged ? "bg-emerald-50/70 ring-emerald-200" : "bg-amber-50/70 ring-amber-200"
      }`}
    >
      <p className="min-w-0 flex-1 break-words whitespace-pre-line text-ink">
        <span className="mr-1 text-xs font-semibold text-muted">Ghi chú:</span>
        {note}
      </p>
      {canAck ? (
        <form action={toggleNoteAck} className="shrink-0">
          <input type="hidden" name="id" value={orderId} />
          <input type="hidden" name="ack" value={acknowledged ? "false" : "true"} />
          <SubmitButton
            className={`flex size-7 items-center justify-center rounded-full text-sm font-bold transition ${
              acknowledged
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "border border-amber-300 bg-white text-amber-600 hover:bg-amber-100"
            }`}
            pendingText=""
          >
            <span aria-hidden>✓</span>
            <span className="sr-only">{acknowledged ? "Bỏ xác nhận ghi chú" : "Xác nhận ghi chú"}</span>
          </SubmitButton>
        </form>
      ) : (
        <span
          className={`shrink-0 text-xs font-semibold ${acknowledged ? "text-emerald-600" : "text-amber-700"}`}
        >
          {acknowledged ? "✓ Quán đã nhận" : "Chờ xác nhận"}
        </span>
      )}
    </div>
  );
}
