import type { FormValue, UploadedFileCache, UploadedFileCacheEntry } from "../types";
import { inject } from "vue";
import injectionSymbols from "./injection-symbols";
import { createUploadedFileCache, cacheFile } from "./uploadedFileCache";
import { fileToBase64 } from "./file-utils";

// Walks a form value and finds every scalar that is an uploaded-file token (i.e. is registered in
// the cache), returning each with its dotted path. A file referenced at several paths is yielded
// once per path so the server can place it at each position when it reassembles the tree.
const collectFiles = (
  cache: UploadedFileCache,
  value: FormValue,
): { path: string; entry: UploadedFileCacheEntry }[] => {
  const found: { path: string; entry: UploadedFileCacheEntry }[] = [];
  const walk = (val: FormValue, pathParts: (string | number)[]): void => {
    if (typeof val === "string") {
      const entry = cache.get(val);
      if (entry) {
        found.push({ path: pathParts.join("."), entry });
      }
    } else if (Array.isArray(val)) {
      val.forEach((sub, index) => walk(sub, pathParts.concat(index)));
    } else if (val != null && typeof val === "object") {
      for (const [key, sub] of Object.entries(val)) {
        walk(sub, pathParts.concat(key));
      }
    }
  };
  walk(value, []);
  return found;
};

// Consumer-facing helpers for submitting a form that contains FileUploadField values. The form
// value holds only tokens; these helpers reunite the tokens with their cached files at submit time.
// Both transports are symmetric: a `data` blob (the whole value, tokens at file positions) plus a
// path-keyed `files` collection — so the backend reassembles each file into the tree at its path
// (`data_set`) and validates it as a unit, yielding errors keyed to match the field paths.
export default function useUploadedFiles() {
  // The plugin always provides the cache; fall back to a transient one so a value with no files
  // still serialises rather than throwing if the helper is used without the plugin installed.
  const cache = inject(injectionSymbols.uploadedFileCache, undefined) ?? createUploadedFileCache();

  // multipart/form-data — `data` is the JSON-encoded value; each inline file is appended as a part
  // under `files[<path>]` (its headers carry the original filename + mime, like a native file input).
  // Synchronous: it only appends already-cached File objects.
  const toFormData = (value: FormValue): FormData => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(value));
    for (const { path, entry } of collectFiles(cache, value)) {
      if (entry.file) {
        formData.append(`files[${path}]`, entry.file, entry.info.name);
      }
    }
    return formData;
  };

  // application/json — a { data, files } envelope mirroring the multipart layout, with each inline
  // file's bytes base64-encoded under its path in `files`. Async because reading bytes is async.
  const toJson = async (value: FormValue): Promise<string> => {
    const files: Record<string, { name: string; type: string; base64_contents: string }> = {};
    for (const { path, entry } of collectFiles(cache, value)) {
      if (entry.file) {
        files[path] = {
          name: entry.info.name,
          type: entry.info.type,
          base64_contents: await fileToBase64(entry.file),
        };
      }
    }
    return JSON.stringify({ data: value, files });
  };

  // Manually cache a File and get back its content-addressed token — for consumers that obtain a
  // File outside a FileUploadField (e.g. drag-and-drop, a Blob built in code) but want it to ride
  // along with the form via toFormData/toJson. Store the returned token in the form value.
  const put = (file: File): Promise<string> => {
    return cacheFile(cache, file);
  };

  const getFile = (token: string): File | undefined => {
    return cache.get(token)?.file;
  };

  const release = (token: string): void => {
    cache.release(token);
  };

  const clear = (): void => {
    cache.clear();
  };

  return { toFormData, toJson, put, getFile, release, clear };
}
