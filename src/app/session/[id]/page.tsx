import { SessionWorkspace } from "@/components/SessionWorkspace";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `جلسة ${id.slice(0, 8)} — OpenCode Cloud` };
}

/**
 * صفحة الجلسة — واجهة OpenCode الأصلية عبر proxy + أدوات:
 * Terminal / ملفات / سجلات / مقاييس / مشاركة / Snapshot / تمديد / إيقاف آمن
 */
export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  return <SessionWorkspace sandboxId={id} />;
}
