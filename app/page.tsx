import { redirect } from "next/navigation";

// El sitio abre en /blog (su home): "/" redirige ahí. (next.config.js también lo redirige antes de renderizar.)
export default function Root() {
  redirect("/blog");
}
