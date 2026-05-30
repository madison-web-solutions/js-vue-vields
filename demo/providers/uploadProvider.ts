import type { UploadProvider, UpdateResult, UploadedFileInfo } from 'vue-fields-ms'

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

// Fakes upload progress so the progress bar is visible in the demo.
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

export const uploadProvider: UploadProvider = {
  async upload(data, progressCallback): Promise<UpdateResult<UploadedFileInfo>> {
    const file = data.get('file') as File;
    const name = (data.get('name') as string) || file.name;
    const base64 = await fileToBase64(file);
    const finish = simulateProgress(file, progressCallback);

    const resp = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type: file.type, base64 }),
    });

    finish();
    return resp.json();
  },
};
