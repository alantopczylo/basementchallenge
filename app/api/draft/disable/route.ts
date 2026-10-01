import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/** Sale de la vista previa y vuelve a la home (botón "Exit preview" del aviso) */
export const GET = async () => {
  (await draftMode()).disable();
  redirect("/blog");
};
