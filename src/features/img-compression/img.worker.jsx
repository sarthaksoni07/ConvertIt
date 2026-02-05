import imageCompression from "browser-image-compression";
self.onmessage = async (e) => {
  try {
    const { file, compressionLevel } = e.data;
    const quality = compressionLevel;
    const maxSizeMB = quality;
    const maxWidthOrHeight = quality * 860;
    
    const options = {
      maxSizeMB,
      maxWidthOrHeight,
      initialQuality: quality,
      useWebWorker: false, 
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
