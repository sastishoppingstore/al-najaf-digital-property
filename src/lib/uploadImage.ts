import { fetchApi } from './registryRates';

export async function uploadImage(file: File): Promise<string | null> {
  if (!file) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const data = String(reader.result || '');
      try {
        const res = await fetchApi({ action: 'upload-image', data, name: file.name });
        if (res.success && res.url) {
          resolve(res.url);
          return;
        }
      } catch {
        // Fallback to data URL
      }
      resolve(data);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

