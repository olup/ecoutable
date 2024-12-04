export const escapeXml = (unsafe: string) =>
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
