import { remark } from "remark";

export const getMarkdownAst = async (markdown: string) => {
  const node = await remark().use().parse(markdown);
  return node;
};

export const cleanMarkdown = (markdown: string) => {
  return markdown
    .replace(/\[\s*\n*\s*!/gs, "[!")
    .replace(/\)\s*\n*\s*]/gs, ")]");
};
