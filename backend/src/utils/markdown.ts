import { remark } from "remark";

export const getMarkdownAst = async (markdown: string) => {
  const node = await remark().use().parse(markdown);
  return node;
};
