self.onmessage = async (e) => {
  const { file } = e.data;

  // simulate heavy compression work
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Create a compressed blob (simulate compression by reducing size)
  const compressedData = new Uint8Array(Math.floor(file.size * 0.6));
  const compressedBlob = new Blob([compressedData], { type: file.type });

  self.postMessage({
    name: file.name,
    originalSize: file.size,
    compressedSize: compressedBlob.size,
    blob: compressedBlob
  });
};
