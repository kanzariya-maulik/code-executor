import { languages } from "monaco-editor";

export function getMonacoLanguageFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return "plaintext";

  const langs = languages.getLanguages();

  for (const lang of langs) {
    if (lang.extensions?.includes("." + ext)) {
      return lang.id;
    }
  }

  return "plaintext";
}
