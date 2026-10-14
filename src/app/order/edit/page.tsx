import { Suspense } from "react";
import OrderEditor from "@/components/OrderEditor";

export default function EditOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-[#204978] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrderEditor />
    </Suspense>
  );
}
