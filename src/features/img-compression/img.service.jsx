export function compressImage(file, compressionLevel = 60) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./img.worker.jsx", import.meta.url), {
      type: "module",
    });
    worker.postMessage({ file, compressionLevel });
    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };
    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };
  });
}
