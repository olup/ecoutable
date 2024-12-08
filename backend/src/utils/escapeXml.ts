export const unescapeXml = (unsafe: string) =>
  unsafe.replace(
    /[<>&'"]/g,
    (c) =>
      `&${
        {
          "<": "lt",
          ">": "gt",
          "&": "amp",
          "'": "apos",
          '"': "quot",
        }[c]
      };`
  );

// Utility function to escape XML characters
export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
