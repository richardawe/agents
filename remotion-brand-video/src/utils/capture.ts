import html2canvas from 'html2canvas';

export function captureFromImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export async function captureFromHtml(file: File): Promise<string> {
  const blobUrl = URL.createObjectURL(file);
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;left:-9999px;top:0;width:1280px;height:720px;border:none;visibility:hidden;pointer-events:none;';
  document.body.appendChild(iframe);

  try {
    iframe.src = blobUrl;
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error('Failed to load HTML file'));
      setTimeout(() => reject(new Error('Timed out loading HTML (15s)')), 15_000);
    });

    // Let images, fonts, and layout settle
    await new Promise((r) => setTimeout(r, 900));

    const doc = iframe.contentDocument;
    if (!doc) throw new Error('Could not access iframe document');

    const canvas = await html2canvas(doc.documentElement, {
      width: 1280,
      height: 720,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: 1280,
      windowHeight: 720,
    });

    return canvas.toDataURL('image/jpeg', 0.92);
  } finally {
    document.body.removeChild(iframe);
    URL.revokeObjectURL(blobUrl);
  }
}
