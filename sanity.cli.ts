import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  // Hostname del Studio hosteado (https://basement-challenge-alan.sanity.studio): evita que `sanity deploy` lo pregunte
  studioHost: "basement-challenge-alan",
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "5lomwcj8",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  },
});
