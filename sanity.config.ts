import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schemaTypes";
import { PreviewAction } from "./sanity/actions/previewAction";

// El estudio corre aparte de Next: el navegador solo ve variables SANITY_STUDIO_*, por eso el id (que no es secreto)
// queda como valor por defecto acá
const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  "5lomwcj8";
const dataset =
  process.env.SANITY_STUDIO_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  "production";

/** "Site settings" es un documento único: se abre directo y no se puede crear otro ni borrar */
const SINGLETONS = ["siteSettings"];

export default defineConfig({
  name: "basement",
  title: "basement. blog",
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("Site settings")
              .id("siteSettings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings"),
              ),
            S.divider(),
            S.documentTypeListItem("post").title("Posts"),
            S.documentTypeListItem("tag").title("Tags"),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(({ schemaType }) => !SINGLETONS.includes(schemaType)),
  },
  document: {
    actions: (input, { schemaType }) => {
      const base = SINGLETONS.includes(schemaType)
        ? input.filter(
            ({ action }) =>
              action && action !== "delete" && action !== "duplicate",
          )
        : input;
      return ["post", "siteSettings"].includes(schemaType)
        ? [...base, PreviewAction]
        : base;
    },
  },
});
