import {describe, expect, it} from 'vitest';
import {fileToDataUrl, isSafeDataUrl, mimeForEditorFile, validateEditorFile} from './media';

const png = new File(['png-bytes'], 'photo.png', {type: 'image/png'});
const pdf = new File(['%PDF'], 'brief.pdf', {type: 'application/pdf'});
const html = new File(['<script>'], 'page.html', {type: 'text/html'});

describe('editor media files', () => {
  it('accepts images for the image picker and rejects other types', () => {
    expect(validateEditorFile(png, 'image')).toBeNull();
    expect(mimeForEditorFile(png, 'image')).toBe('image/png');
    expect(validateEditorFile(pdf, 'image')).toMatch(/PNG, JPEG, GIF, or WebP/i);
  });

  it('rejects oversized files', () => {
    const huge = new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'big.png', {type: 'image/png'});
    expect(validateEditorFile(huge, 'image')).toMatch(/8 MB/i);
  });

  it('allows documents in the file picker and blocks HTML', () => {
    expect(validateEditorFile(pdf, 'file')).toBeNull();
    expect(validateEditorFile(html, 'file')).toMatch(/PDF, Office document, ZIP, or image/i);
  });

  it('reads a file into a typed data URL', async () => {
    const url = await fileToDataUrl(png, 'image/png');
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
    expect(isSafeDataUrl(url, true)).toBe(true);
  });

  it('treats only allowlisted data URLs as safe', () => {
    expect(isSafeDataUrl('data:image/png;base64,abc', true)).toBe(true);
    expect(isSafeDataUrl('data:text/html;base64,abc', true)).toBe(false);
    expect(isSafeDataUrl('data:image/svg+xml;base64,abc', true)).toBe(false);
  });
});
