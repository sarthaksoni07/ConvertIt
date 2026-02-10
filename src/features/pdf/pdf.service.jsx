export function compressPdf(file, compressionLevel = 3) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./pdf.worker.jsx", import.meta.url), {
      type: "module",
    });
    worker.postMessage({ file, compressionLevel });
    worker.onmessage = (e) => {
      const { data } = e;
      if (data.type === "done") {
        resolve(data.result);
        worker.terminate();
      } else if (data.type === "error") {
        reject(new Error(data.message));
        worker.terminate();
      }
    };
    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };
  });
}
