import type { MediaProvider, UpdateResult, MediaItem } from 'vue-fields-ms'

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const simulateProgress = (
  file: File,
  progressCallback: (loaded: number, total: number) => void,
): () => void => {
  const total = file.size || 1024;
  let loaded = 0;
  const step = total / 10;
  const interval = setInterval(() => {
    loaded = Math.min(loaded + step, total * 0.9);
    progressCallback(loaded, total);
  }, 80);
  return () => {
    clearInterval(interval);
    progressCallback(total, total);
  };
};

const uploadFile = async (
  url: string,
  method: string,
  file: File,
  extraFields: Record<string, unknown>,
  progressCallback: (loaded: number, total: number) => void,
): Promise<UpdateResult<MediaItem>> => {
  const base64 = await fileToBase64(file);
  const finish = simulateProgress(file, progressCallback);

  const resp = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, base64, ...extraFields }),
  });

  finish();
  return resp.json();
};

export const mediaProvider: MediaProvider = {
  async search(searchText = '', page = 1, _extraParams) {
    const params = new URLSearchParams({
      search: searchText,
      page: String(page),
    })
    const resp = await fetch(`/api/media?${params}`)
    return resp.json()
  },

  async lookup(key) {
    const resp = await fetch(`/api/media/${encodeURIComponent(String(key))}`)
    return resp.json()
  },

  async upload(data, progressCallback) {
    const file = data.get('file') as File
    const title = data.get('title') as string
    return uploadFile('/api/media', 'POST', file, { title }, progressCallback)
  },

  async replace(key, data, progressCallback) {
    const file = data.get('file') as File
    return uploadFile(`/api/media/${encodeURIComponent(String(key))}`, 'PUT', file, {}, progressCallback)
  },

  async delete(key) {
    const resp = await fetch(`/api/media/${encodeURIComponent(String(key))}`, { method: 'DELETE' })
    return resp.json()
  },

  async update(key, data) {
    const resp = await fetch(`/api/media/${encodeURIComponent(String(key))}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return resp.json()
  },
}
