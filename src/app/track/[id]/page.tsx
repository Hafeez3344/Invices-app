import { Suspense } from "react";
import TrackClient from "./TrackClient";

export default function TrackPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-[#204978] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TrackClient id={params.id} />
    </Suspense>
  );
}
