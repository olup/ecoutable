type MarkdownNode =
  | RootNode
  | ParagraphNode
  | TextNode
  | HeadingNode
  | EmphasisNode
  | StrongNode
  | LinkNode
  | ImageNode
  | BlockquoteNode
  | CodeNode
  | InlineCodeNode
  | ListNode
  | ListItemNode
  | ThematicBreakNode
  | BreakNode
  | TableNode
  | TableRowNode
  | TableCellNode;

// Individual Node Types
interface RootNode {
  type: "root";
  children: MarkdownNode[];
}

interface ParagraphNode {
  type: "paragraph";
  children: MarkdownNode[];
}

interface TextNode {
  type: "text";
  value: string;
}

interface HeadingNode {
  type: "heading";
  depth: number; // 1-6 for <h1> to <h6>
  children: MarkdownNode[];
}

interface EmphasisNode {
  type: "emphasis";
  children: MarkdownNode[];
}

interface StrongNode {
  type: "strong";
  children: MarkdownNode[];
}

interface LinkNode {
  type: "link";
  url: string;
  title?: string;
  children: MarkdownNode[];
}

interface ImageNode {
  type: "image";
  url: string;
  title?: string;
  alt?: string;
}

interface BlockquoteNode {
  type: "blockquote";
  children: MarkdownNode[];
}

interface CodeNode {
  type: "code";
  lang?: string;
  meta?: string;
  value: string;
}

interface InlineCodeNode {
  type: "inlineCode";
  value: string;
}

interface ListNode {
  type: "list";
  ordered: boolean;
  start?: number;
  spread: boolean;
  children: MarkdownNode[];
}

interface ListItemNode {
  type: "listItem";
  spread: boolean;
  children: MarkdownNode[];
}

interface ThematicBreakNode {
  type: "thematicBreak";
}

interface BreakNode {
  type: "break";
}

interface TableNode {
  type: "table";
  align?: Array<"left" | "center" | "right" | null>;
  children: TableRowNode[];
}

interface TableRowNode {
  type: "tableRow";
  children: TableCellNode[];
}

interface TableCellNode {
  type: "tableCell";
  children: MarkdownNode[];
}

export type MardownTypes =
  | "heading"
  | "paragraph"
  | "list"
  | "table"
  | "code"
  | "blockquote"
  | "image"
  | "link"
  | "horizontalRule"
  | "softBreak"
  | "hardBreak"
  | "text";
