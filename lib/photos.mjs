export function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return reject(new Error('Gunakan JPG, PNG, atau WebP.'));
    if (file.size > 10 * 1024 * 1024) return reject(new Error('Foto maksimal 10 MB.'));
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const ratio = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        const context = canvas.getContext('2d');
        context.fillStyle = '#342037';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        let result = canvas.toDataURL('image/jpeg', .8);
        if (result.length > 900000) result = canvas.toDataURL('image/jpeg', .55);
        if (result.length > 1500000) throw new Error('Foto terlalu kompleks. Coba file lebih kecil.');
        resolve(result);
      } catch (error) { reject(error); }
      finally { URL.revokeObjectURL(url); }
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gambar tidak dapat dibaca.')); };
    image.src = url;
  });
}
