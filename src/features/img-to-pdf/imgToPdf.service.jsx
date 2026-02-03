export function convertImgToPdf(files, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./imgToPdf.worker.jsx", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (e) => {
      const data = e.data;

      if (data.type === "progress") {
        onProgress?.(data.value);
        return;
      }

      if (data.type === "done") {
        resolve(data.result);
        worker.terminate();
        return;
      }

      if (data.type === "error") {
        reject(new Error(data.message));
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };

    // Handle both single file and multiple files
    const fileArray = Array.isArray(files) ? files : [files];
    worker.postMessage({ files: fileArray });
  });
}
