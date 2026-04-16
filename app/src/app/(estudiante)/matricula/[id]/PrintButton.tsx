"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-sm bg-[#0B1F3A] text-white px-4 py-2 rounded-lg hover:bg-[#162d52] transition-colors print:hidden"
    >
      Imprimir / Guardar PDF
    </button>
  );
}
