export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./img.worker.jsx", import.meta.url), {
      type: "module",
    });
    worker.postMessage({ file });
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
