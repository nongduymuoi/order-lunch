import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/badges";
import { PageHeader, PageSkeleton } from "@/components/page";
import { requireUser } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/format";
import { AvatarEditor } from "./avatar-editor";
import { NameForm, PasswordForm } from "./profile-forms";

export const metadata: Metadata = { title: "Hồ sơ — Mộc" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  const user = await requireUser();
  return (
    <>
      <PageHeader eyebrow="Tài khoản" title="Hồ sơ của tôi" description="Cập nhật thông tin cá nhân" />
      <div className="grid items-start gap-6 lg:grid-cols-[17rem_1fr]">
        <section className="card flex flex-col items-center px-6 py-8 text-center">
          <AvatarEditor name={user.name} url={user.avatarUrl} />
          <p className="mt-5 font-display text-xl font-semibold text-navy-900">{user.name}</p>
          <p className="mt-1 text-sm text-muted">@{user.username}</p>
          <div className="mt-4">
            <Badge tone="blue">{ROLE_LABEL[user.role]}</Badge>
          </div>
        </section>

        <section className="card p-6 sm:p-7">
          <h2 className="mb-5 font-display text-xl font-semibold text-navy-900">Thông tin cá nhân</h2>
          <NameForm key={user.name} username={user.username} name={user.name} />
        </section>
      </div>

      <section className="card mt-6 p-6 sm:p-7">
        <h2 className="mb-5 font-display text-xl font-semibold text-navy-900">Đổi mật khẩu</h2>
        <PasswordForm />
      </section>
    </>
  );
}
