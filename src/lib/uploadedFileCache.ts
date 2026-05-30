import type { UploadedFileInfo, UploadedFileCache, UploadedFileCacheEntry } from "../types";
import { fileToSha256Hex } from "./file-utils";

// Client-side registry mapping an uploaded file's token to its metadata and (for `inline` mode) the
// real File. FileUploadField stores only the token in the form value; the bytes/metadata live here,
// recovered at submit time by the useUploadedFiles helpers. One cache is provided per app by the
// plugin (rather than a module global) so instances don't share state and tests stay isolated.

export const createUploadedFileCache = (): UploadedFileCache => {
  const entries = new Map<string, UploadedFileCacheEntry>();
  return {
    put: (info: UploadedFileInfo, file?: File): void => {
      entries.set(info.token, { info, file });
    },
    get: (token: string): UploadedFileCacheEntry | undefined => {
      return entries.get(token);
    },
    has: (token: string): boolean => {
      return entries.has(token);
    },
    release: (token: string): void => {
      entries.delete(token);
    },
    clear: (): void => {
      entries.clear();
    },
  };
};

// Hash a File and store it under a content-addressed token (`vfmfile_<sha256>`), returning the
// token. Shared by FileUploadField's inline mode and useUploadedFiles().put so the token scheme
// lives in one place.
export const cacheFile = async (cache: UploadedFileCache, file: File): Promise<string> => {
  const hash = await fileToSha256Hex(file);
  const token = `vfmfile_${hash}`;
  cache.put({ token, name: file.name, type: file.type, size: file.size }, file);
  return token;
};
