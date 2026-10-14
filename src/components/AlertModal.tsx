"use client";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onClose: () => void;
};

const styles = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    btn: "bg-emerald-600 hover:bg-emerald-700",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    btn: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    btn: "bg-yellow-600 hover:bg-yellow-700",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
};

export default function AlertModal({
  isOpen,
  title,
  message,
  type = "info",
  onClose,
}: Props) {
  if (!isOpen) return null;
  const s = styles[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div
        className={`w-full max-w-md rounded-xl border ${s.border} ${s.bg} bg-white p-5 shadow-xl font-cairo`}
      >
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
          {message}
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${s.btn}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
