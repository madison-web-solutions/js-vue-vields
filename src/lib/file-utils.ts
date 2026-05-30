// Helpers for FileUploadField and its submission helpers. SHA-256 is used (not md5, which the Web
// Crypto API does not provide) so the content-hash token is dependency-free.

export const fileToSha256Hex = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
};

// Reads a file as a base64 string (without the `data:...;base64,` data-URL prefix), for inlining the
// bytes into a pure-JSON submission (see useUploadedFiles.toJson).
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};
