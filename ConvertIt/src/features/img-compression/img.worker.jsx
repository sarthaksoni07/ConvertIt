import imageCompression from "browser-image-compression";
self.onmessage = async (e) => {
  try {
    const { file } = e.data;

    const options = {
      maxSizeMB: 1, // target size
      maxWidthOrHeight: 1920,
      useWebWorker: false, // already inside worker
    };
    const compressedBlob = await imageCompression(file, options);
    self.postMessage({
      name: file.name,
      originalSize: file.size,
      compressedSize: compressedBlob.size,
      blob: compressedBlob,
    });
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
