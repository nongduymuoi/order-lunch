import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page";
import { PickupList } from "../pickup-list";

export const metadata: Metadata = { title: "Danh sách lấy cơm trưa — Mộc" };

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PickupList kind="lunch" />
    </Suspense>
  );
}
