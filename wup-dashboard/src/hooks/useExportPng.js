import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';

/**
 * Hook do eksportu elementu DOM jako PNG.
 * Zwraca [ref, exportFn].
 * ref     — podpięty do kontenera do eksportu
 * exportFn(filename) — wywołaj, żeby pobrać plik PNG
 */
export default function useExportPng() {
  const ref = useRef(null);

  const exportPng = useCallback(async (filename = 'wykres') => {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,                // 2x dla ostrości / Retina
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Eksport PNG nie powiódł się:', e);
    }
  }, []);

  return [ref, exportPng];
}
