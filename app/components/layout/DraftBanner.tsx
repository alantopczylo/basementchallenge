import { draftMode } from "next/headers";

/** Aviso fijo mientras la vista previa de borradores está activa, con la salida a un clic */
export const DraftBanner = async () => {
  if (!(await draftMode()).isEnabled) return null;
  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-[10001] flex items-center gap-3 rounded-sm bg-basement-orange px-3 py-2 font-mono text-[12px] font-medium uppercase text-basement-black"
    >
      Preview mode: showing drafts
      {/* Navegación completa (no SPA): el modo draft se apaga con una cookie del servidor */}
      <a
        href="/api/draft/disable"
        data-no-transition
        className="underline underline-offset-2"
      >
        Exit preview
      </a>
    </div>
  );
};
