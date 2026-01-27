self.onmessage = async (e) => {
  const { file } = e.data;

  // simulate heavy compression work
  await new Promise((resolve) => setTimeout(resolve, 1000));

  self.postMessage({
    name: file.name,
    originalSize: file.size,
    compressedSize: Math.floor(file.size * 0.6)
  });
};
