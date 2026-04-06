export type ImageDimensions = { width: number; height: number };

/**
 * Extrae las dimensiones de una imagen a partir de su Buffer.
 * Soporta PNG, JPEG, GIF, WebP y SVG.
 * Devuelve null si no puede determinar las dimensiones.
 */
export function getImageDimensionsFromBuffer(buf: Buffer): ImageDimensions | null {
  try {
    // PNG: firma 8 bytes, luego IHDR: 4 len + 4 "IHDR" + 4 width + 4 height
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }

    // JPEG: empieza con FFD8
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 8) {
        if (buf[i] !== 0xff) break;
        const marker = buf[i + 1];
        if (
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf)
        ) {
          return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }

    // GIF: GIF87a o GIF89a — width/height en bytes 6-9 (little-endian)
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
      return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }

    // WebP: RIFF....WEBP
    if (
      buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
    ) {
      const chunkId = buf.slice(12, 16).toString('ascii');
      if (chunkId === 'VP8 ') {
        return {
          width: (buf.readUInt16LE(26) & 0x3fff) + 1,
          height: (buf.readUInt16LE(28) & 0x3fff) + 1,
        };
      }
      if (chunkId === 'VP8L') {
        const bits = buf.readUInt32LE(25);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (chunkId === 'VP8X') {
        return {
          width: (buf[24] | (buf[25] << 8) | (buf[26] << 16)) + 1,
          height: (buf[27] | (buf[28] << 8) | (buf[29] << 16)) + 1,
        };
      }
    }

    // SVG: parsear como texto buscando width/height o viewBox
    const str = buf.toString('utf8', 0, Math.min(buf.length, 2048));
    if (str.includes('<svg')) {
      const wMatch = str.match(/\bwidth=["']([0-9.]+)/);
      const hMatch = str.match(/\bheight=["']([0-9.]+)/);
      if (wMatch && hMatch) {
        return { width: parseFloat(wMatch[1]), height: parseFloat(hMatch[1]) };
      }
      const vbMatch = str.match(/viewBox=["'][0-9. ]*\s([0-9.]+)\s([0-9.]+)/);
      if (vbMatch) {
        return { width: parseFloat(vbMatch[1]), height: parseFloat(vbMatch[2]) };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extrae las dimensiones a partir de un data URI base64.
 */
export function getImageDimensionsFromDataUri(dataUri: string): ImageDimensions | null {
  try {
    const commaIdx = dataUri.indexOf(',');
    if (commaIdx === -1) return null;
    const buf = Buffer.from(dataUri.slice(commaIdx + 1), 'base64');
    return getImageDimensionsFromBuffer(buf);
  } catch {
    return null;
  }
}

/**
 * Devuelve true si el data URI contiene una imagen rasterizada compatible con @react-pdf/renderer.
 * SVG no está soportado por el componente <Image> de react-pdf.
 */
export function isRasterDataUri(dataUri: string | null | undefined): boolean {
  if (!dataUri) return false;
  const mime = dataUri.slice(5, dataUri.indexOf(';'));
  return mime !== 'image/svg+xml';
}
