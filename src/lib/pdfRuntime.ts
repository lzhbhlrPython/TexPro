import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let pending: Promise<typeof import('pdfjs-dist')> | undefined;

/** Writing a plain document should not load the PDF renderer. */
export function loadPdfRuntime() {
  return pending ||= import('pdfjs-dist').then(runtime => {
    runtime.GlobalWorkerOptions.workerSrc = workerUrl;
    return runtime;
  }).catch(error => { pending = undefined; throw error; });
}
