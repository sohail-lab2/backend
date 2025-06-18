import fs from 'fs';

export function cleanMongoData<T extends Record<string, any>>(data: T | T[]): any {
  const clean = (item: any): any => {
    if (Array.isArray(item)) {
      return item
        .map(clean)
        .filter(el => el !== null);
    }

    if (item instanceof Date) {
      return item; // ✅ Preserve Date as-is
    }

    if (item && typeof item === 'object' && !Buffer.isBuffer(item)) {
      const { __v, createdAt, updatedAt, _id, ...rest } = item;

      const cleaned: Record<string, any> = {};

      for (const [key, value] of Object.entries(rest)) {
        if (Buffer.isBuffer(value)) {
          continue;
        }

        const cleanedValue = clean(value);

        // Filter out null/undefined/empty strings/empty arrays
        const isEmptyArray = Array.isArray(cleanedValue) && cleanedValue.length === 0;
        const isInvalid =
          cleanedValue === null ||
          cleanedValue === undefined ||
          cleanedValue === '' ||
          isEmptyArray;

        if (!isInvalid) {
          cleaned[key] = cleanedValue;
        }
      }

      if (_id) {
        cleaned.id = _id.toString();
      }

      return cleaned;
    }

    if (Buffer.isBuffer(item)) {
      return null;
    }

    return item;
  };

  return Array.isArray(data) ? data.map(clean) : clean(data);
}

export const deleteFile = (filePath: string) => {
  try {
    fs.unlinkSync(filePath);
    console.log(`Successfully deleted file: ${filePath}`);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      console.warn(`File not found, skipping deletion: ${filePath}`);
    } else {
      console.error(`Error deleting file: ${filePath}`, err);
    }
  }
};