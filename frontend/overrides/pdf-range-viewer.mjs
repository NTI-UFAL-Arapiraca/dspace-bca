import { PDFDataRangeTransport } from '../build/pdf.mjs';

/** Keep authenticated HTTP in Angular; PDF.js requests only the ranges it needs. */
export function installRepositoryPdfViewer(application, target = window) {
  let active = false;
  target.repositoryPdfViewer = {
    async open(source) {
      await application.initializedPromise;
      active = true;
      const fail = () => {
        if (!active) return;
        active = false;
        source.onError();
        void application.close();
      };
      class RepositoryRangeTransport extends PDFDataRangeTransport {
        requestDataRange(begin, end) {
          source.readRange(begin, end).then(buffer => {
            // PDF.js checks ArrayBuffer's realm before transferring it to its worker.
            if (active) this.onDataRange(begin, new Uint8Array(buffer).slice());
          }).catch(fail);
        }
        abort() {
          active = false;
        }
      }
      try {
        await application.open({
          range: new RepositoryRangeTransport(source.length, new Uint8Array(0), true, source.filename),
          length: source.length,
          rangeChunkSize: 256 * 1024,
          disableAutoFetch: true,
          disableStream: true,
          disableRange: false,
        });
        if (active) source.onReady();
      } catch {
        fail();
      }
    },
    close() {
      active = false;
      void application.close();
    },
  };
}
