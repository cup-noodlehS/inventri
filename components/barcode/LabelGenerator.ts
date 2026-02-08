import { escapeHtml, escapeJsString } from '@/lib/utils/barcode';

export interface LabelData {
  barcodeValue: string;
  productName?: string;
  volumeMl?: number;
}

export interface GenerateLabelHTMLOptions {
  labels: LabelData[];
  format: string;
  getBarcodeValue: (unitNum: number) => string;
}

export function generateLabelHTML({ labels, format, getBarcodeValue }: GenerateLabelHTMLOptions): string {
  const labelHTML = labels.map((label, index) => {
    const escapedProductName = label.productName ? escapeHtml(label.productName) : '';
    return `
      <div class="label-page">
        <div class="barcode-container">
          ${label.productName ? `<div class="product-info">${escapedProductName}<br>${label.volumeMl}ml</div>` : ''}
          <svg id="barcode-svg-${index + 1}" width="100%" height="60"></svg>
          <div class="barcode-value">${escapeHtml(label.barcodeValue)}</div>
        </div>
      </div>
    `;
  }).join('');

  const scriptContent = labels.map((_, i) => {
    const barcodeVal = getBarcodeValue(i + 1);
    const escapedValue = escapeJsString(barcodeVal);
    return `
      try {
        JsBarcode("#barcode-svg-${i + 1}", "${escapedValue}", {
          format: "${format}",
          width: 2,
          height: 50,
          displayValue: false,
          background: "#ffffff",
          lineColor: "#000000",
          valid: function(valid) {
            if (!valid) {
              console.error("Invalid barcode value for label ${i + 1}: ${escapedValue}");
            }
          }
        });
      } catch (e) {
        console.error("Error generating barcode ${i + 1}:", e);
      }
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page {
            size: 2in 1in;
            margin: 0.1in;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .label-page {
            page-break-after: always;
            width: 2in;
            height: 1in;
            padding: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }
          .label-page:last-child {
            page-break-after: auto;
          }
          .barcode-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
          }
          .product-info {
            text-align: center;
            margin-bottom: 4px;
            font-size: 10px;
            font-weight: bold;
          }
          .barcode-value {
            text-align: center;
            margin-top: 4px;
            font-size: 9px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        ${labelHTML}
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
        <script>
          ${scriptContent}
        </script>
      </body>
    </html>
  `;
}

