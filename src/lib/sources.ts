import type { SourcesFile } from "../types";

export function parseSourcesFile(data: unknown): SourcesFile {
  if (!data || typeof data !== "object") throw new Error("sources.json nie jest obiektem");
  const file = data as SourcesFile;
  if (!Array.isArray(file.sections) || file.sections.length === 0) {
    throw new Error("sources.json nie ma sekcji");
  }
  for (const section of file.sections) {
    if (!section.title || !section.intro || !Array.isArray(section.items) || section.items.length === 0) {
      throw new Error(`Sekcja źródeł „${section.title || "?"}" jest pusta`);
    }
    for (const item of section.items) {
      if (!item.name || !item.detail || !Array.isArray(item.links) || item.links.length === 0) {
        throw new Error(`Źródło „${item.name || "?"}" nie ma linku`);
      }
      for (const link of item.links) {
        if (!/^https?:\/\//.test(link.url) || !link.label) {
          throw new Error(`Link w „${item.name}” jest niekompletny`);
        }
      }
    }
  }
  return file;
}
