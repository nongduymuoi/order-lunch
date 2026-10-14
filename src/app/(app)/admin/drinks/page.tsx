import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page";
import { PickupList } from "../pickup-list";

export const metadata: Metadata = { title: "Danh sách lấy nước — Mộc" };

export default function AdminDrinksPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PickupList kind="drink" />
    </Suspense>
  );
}
