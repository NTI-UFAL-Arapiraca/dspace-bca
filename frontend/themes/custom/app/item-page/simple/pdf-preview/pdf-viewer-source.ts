/** Same-origin bridge: only bytes and callbacks cross into the local viewer. */
export interface PdfViewerSource {
  length: number;
  filename: string;
  readRange: (begin: number, end: number) => Promise<ArrayBuffer>;
  onReady: () => void;
  onError: () => void;
}

export interface PdfViewerBridge {
  open: (source: PdfViewerSource) => Promise<void>;
  close: () => void;
}

export interface PdfViewerWindow extends Window {
  repositoryPdfViewer?: PdfViewerBridge;
}
