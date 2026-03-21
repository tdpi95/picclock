export async function compressImage(
    file: Blob,
    maxSize = 1920,
    quality = 0.85,
): Promise<Blob> {
    try {
        const bitmap = await createImageBitmap(file);

        const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
        const w = Math.round(bitmap.width * scale);
        const h = Math.round(bitmap.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get 2d context");
        
        ctx.drawImage(bitmap, 0, 0, w, h);

        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (b) => {
                    if (b) resolve(b);
                    else reject(new Error("Canvas toBlob failed"));
                },
                "image/webp",
                quality
            );
        });
    } catch (err) {
        console.error("Error in compressImage while decoding blob:", err);
        throw err;
    }
}

export function createThumbnail(file: Blob): Promise<Blob> {
    return compressImage(file, 300, 0.7);
}
