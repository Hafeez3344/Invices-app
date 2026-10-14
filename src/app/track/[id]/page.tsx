import { BRAND } from "@/lib/defaults";

export default function TrackPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 font-cairo flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/wasl-logo.jpg"
          alt={BRAND.name}
          className="mx-auto mb-4 h-16 w-16 rounded-xl object-cover"
        />
        <h1 className="text-xl font-bold text-[#204978]">{BRAND.nameAr}</h1>
        <p className="mt-2 text-sm text-slate-600">تتبع سند التسليم</p>
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 break-all">
          ID: {params.id}
        </p>
        <p className="mt-4 text-sm text-slate-500">
          افتح التطبيق لتحديث حالة الشحنة (قيد النقل / تم التسليم / ملغى).
        </p>
      </div>
    </div>
  );
}
