import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {assertFileBlob, isPreviewableFile, openPreviewWindow, saveBlob, showBlobInPreviewWindow} from './downloadBlob';

describe('downloadBlob utilities', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const createObjectURL = vi.fn(() => 'blob:fixture');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(URL, 'createObjectURL', {configurable: true, value: createObjectURL});
    Object.defineProperty(URL, 'revokeObjectURL', {configurable: true, value: revokeObjectURL});
  });

  afterEach(() => {
    document.body.replaceChildren();
    Object.defineProperty(URL, 'createObjectURL', {configurable: true, value: originalCreateObjectURL});
    Object.defineProperty(URL, 'revokeObjectURL', {configurable: true, value: originalRevokeObjectURL});
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('starts a browser download before cleaning up the temporary URL', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    saveBlob(new Blob(['report']), 'report.pdf');

    const anchor = document.querySelector<HTMLAnchorElement>('a[download="report.pdf"]');
    expect(anchor?.href).toBe('blob:fixture');
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);
    expect(document.querySelector('a[download="report.pdf"]')).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(59_000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fixture');
  });

  it('opens the preview synchronously and navigates it after bytes arrive', () => {
    const previewDocument = document.implementation.createHTMLDocument();
    const replace = vi.fn();
    const previewWindow = {
      opener: window,
      document: previewDocument,
      location: {replace},
    } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(previewWindow);

    const opened = openPreviewWindow();
    expect(opened).toBe(previewWindow);
    expect(previewWindow.opener).toBeNull();
    expect(previewDocument.body.textContent).toBe('Loading preview…');

    showBlobInPreviewWindow(previewWindow, new Blob(['preview']));
    expect(replace).toHaveBeenCalledWith('blob:fixture');
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5 * 60_000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fixture');
  });

  it('recognizes only browser-previewable PDF and image types', () => {
    expect(isPreviewableFile('brief.PDF', '')).toBe(true);
    expect(isPreviewableFile('photo.bin', 'image/png')).toBe(true);
    expect(isPreviewableFile('spreadsheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(false);
  });

  it('rejects empty and JSON responses before opening or saving them as files', () => {
    expect(() => assertFileBlob(new Blob([], {type: 'application/pdf'}))).toThrow();
    expect(() => assertFileBlob(new Blob(['{}'], {type: 'application/json'}))).toThrow();
    expect(() => assertFileBlob(new Blob(['%PDF'], {type: 'application/pdf'}))).not.toThrow();
  });
});
