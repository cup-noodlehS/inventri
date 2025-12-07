import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import { TransactionWithItems } from '@/lib/api/transactions';
import { CurrentStock, TransactionItem } from '@/lib/types';

// Workaround for expo-file-system v19 type definitions
const getDocumentDirectory = (): string => {
  const docDir = (FileSystem as any).documentDirectory;
  const cacheDir = (FileSystem as any).cacheDirectory;
  return docDir || cacheDir || '';
};

// Helper Functions
export function escapeCSV(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateFilename(prefix: string, extension: string): string {
  const now = new Date();
  const dateStr = format(now, 'yyyy-MM-dd');
  const timeStr = format(now, 'HHmmss');
  return `${prefix}_${dateStr}_${timeStr}${extension}`;
}

export function generateHTMLTable(headers: string[], rows: string[][]): string {
  const headerRow = headers.map((h) => `<th>${h}</th>`).join('');
  const dataRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('');

  return `
    <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
      <thead>
        <tr style="background-color: #f3f4f6; font-weight: bold;">
          ${headerRow}
        </tr>
      </thead>
      <tbody>
        ${dataRows}
      </tbody>
    </table>
  `;
}

// Products Export Functions
export async function exportProductsToCSV(
  products: CurrentStock[],
  filename?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!products || products.length === 0) {
      return { success: false, error: 'No products to export' };
    }

    const file = filename || generateFilename('products', '.csv');

    // Headers
    const headers = ['SKU', 'Name', 'Category', 'Price', 'Stock', 'Min Threshold', 'Barcode', 'Value'];
    const csvRows = [headers.join(',')];

    // Data rows
    products.forEach((product) => {
      const row = [
        escapeCSV(product.sku),
        escapeCSV(product.name),
        escapeCSV(product.category_name || 'Uncategorized'),
        escapeCSV(formatCurrency(product.price)),
        escapeCSV(String(product.quantity_on_hand)),
        escapeCSV(String(product.min_stock_threshold)),
        escapeCSV(product.barcode_value || ''),
        escapeCSV(formatCurrency(product.total_value)),
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const fileUri = getDocumentDirectory() + file;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: 'utf8' as any,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Products CSV',
      });
    } else {
      return { success: false, error: 'Sharing is not available on this device' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Export products CSV error:', error);
    return { success: false, error: error?.message || 'Failed to export products to CSV' };
  }
}

export async function exportProductsToExcel(
  products: CurrentStock[],
  filename?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!products || products.length === 0) {
      return { success: false, error: 'No products to export' };
    }

    const file = filename || generateFilename('products', '.xlsx');

    // Prepare data for Excel
    const excelData = products.map((product) => ({
      SKU: product.sku,
      Name: product.name,
      Category: product.category_name || 'Uncategorized',
      Price: product.price,
      'Stock Quantity': product.quantity_on_hand,
      'Min Stock Threshold': product.min_stock_threshold,
      'Barcode Value': product.barcode_value || '',
      'Barcode Type': product.barcode_type || '',
      'Total Value': product.total_value,
      Description: product.description || '',
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // SKU
      { wch: 30 }, // Name
      { wch: 15 }, // Category
      { wch: 12 }, // Price
      { wch: 12 }, // Stock Quantity
      { wch: 15 }, // Min Threshold
      { wch: 20 }, // Barcode Value
      { wch: 12 }, // Barcode Type
      { wch: 15 }, // Total Value
      { wch: 40 }, // Description
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Convert to base64
    const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const fileUri = getDocumentDirectory() + file;

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
      encoding: 'base64' as any,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Products Excel',
      });
    } else {
      return { success: false, error: 'Sharing is not available on this device' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Export products Excel error:', error);
    return { success: false, error: error?.message || 'Failed to export products to Excel' };
  }
}

export async function exportProductsToPDF(
  products: CurrentStock[],
  filename?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!products || products.length === 0) {
      return { success: false, error: 'No products to export' };
    }

    const file = filename || generateFilename('products', '.pdf');

    // Calculate summary stats
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity_on_hand, 0);
    const totalValue = products.reduce((sum, p) => sum + p.total_value, 0);

    // Prepare table data
    const headers = ['SKU', 'Name', 'Category', 'Price', 'Stock', 'Min Threshold', 'Value'];
    const rows = products.map((product) => [
      product.sku,
      product.name,
      product.category_name || 'Uncategorized',
      formatCurrency(product.price),
      String(product.quantity_on_hand),
      String(product.min_stock_threshold),
      formatCurrency(product.total_value),
    ]);

    const tableHTML = generateHTMLTable(headers, rows);

    // Generate HTML document
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              color: #1f2937;
              margin-bottom: 10px;
            }
            .summary {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .summary-item {
              display: inline-block;
              margin-right: 30px;
            }
            .summary-label {
              font-size: 12px;
              color: #6b7280;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #3b82f6;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
          </style>
        </head>
        <body>
          <h1>Products Export</h1>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Products</div>
              <div class="summary-value">${totalProducts}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Stock</div>
              <div class="summary-value">${totalStock.toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Value</div>
              <div class="summary-value">${formatCurrency(totalValue)}</div>
            </div>
          </div>
          ${tableHTML}
          <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
            Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm')}
          </p>
        </body>
      </html>
    `;

    // Generate PDF
    const { uri } = await Print.printToFileAsync({ html });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Products PDF',
      });
    } else {
      return { success: false, error: 'Sharing is not available on this device' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Export products PDF error:', error);
    return { success: false, error: error?.message || 'Failed to export products to PDF' };
  }
}

// Transactions Export Functions
export async function exportTransactionsToCSV(
  transactions: TransactionWithItems[],
  filename?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!transactions || transactions.length === 0) {
      return { success: false, error: 'No transactions to export' };
    }

    const file = filename || generateFilename('transactions', '.csv');

    // Headers
    const headers = ['ID', 'Date', 'Type', 'SKU', 'Product', 'Quantity', 'Price', 'Total', 'Reference', 'Performed By'];
    const csvRows = [headers.join(',')];

    // Flatten transactions with items
    transactions.forEach((transaction) => {
      const transactionDate = format(new Date(transaction.timestamp), 'yyyy-MM-dd HH:mm');
      const items = transaction.transaction_item || [];

      if (items.length === 0) {
        // Transaction without items
        const row = [
          escapeCSV(String(transaction.id)),
          escapeCSV(transactionDate),
          escapeCSV(transaction.transaction_type),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(transaction.reference || ''),
          escapeCSV(transaction.performed_by),
        ];
        csvRows.push(row.join(','));
      } else {
        // Transaction with items
        items.forEach((item: TransactionItem) => {
          const row = [
            escapeCSV(String(transaction.id)),
            escapeCSV(transactionDate),
            escapeCSV(transaction.transaction_type),
            escapeCSV(item.sku),
            escapeCSV(''), // Product name would need to be joined
            escapeCSV(String(item.quantity)),
            escapeCSV(formatCurrency(item.unit_price_at_transaction)),
            escapeCSV(formatCurrency(item.total_amount)),
            escapeCSV(transaction.reference || ''),
            escapeCSV(transaction.performed_by),
          ];
          csvRows.push(row.join(','));
        });
      }
    });

    const csvContent = csvRows.join('\n');
    const fileUri = getDocumentDirectory() + file;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: 'utf8' as any,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Transactions CSV',
      });
    } else {
      return { success: false, error: 'Sharing is not available on this device' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Export transactions CSV error:', error);
    return { success: false, error: error?.message || 'Failed to export transactions to CSV' };
  }
}

export async function exportTransactionsToExcel(
  transactions: TransactionWithItems[],
  filename?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!transactions || transactions.length === 0) {
      return { success: false, error: 'No transactions to export' };
    }

    const file = filename || generateFilename('transactions', '.xlsx');

    // Flatten transactions with items
    const excelData: any[] = [];
    transactions.forEach((transaction) => {
      const transactionDate = format(new Date(transaction.timestamp), 'yyyy-MM-dd HH:mm');
      const items = transaction.transaction_item || [];

      if (items.length === 0) {
        excelData.push({
          'Transaction ID': transaction.id,
          Date: transactionDate,
          Type: transaction.transaction_type,
          SKU: '',
          Quantity: '',
          'Unit Price': '',
          'Total Amount': '',
          Reference: transaction.reference || '',
          'Performed By': transaction.performed_by,
          Status: transaction.status,
          Notes: transaction.notes || '',
        });
      } else {
        items.forEach((item: TransactionItem) => {
          excelData.push({
            'Transaction ID': transaction.id,
            Date: transactionDate,
            Type: transaction.transaction_type,
            SKU: item.sku,
            Quantity: item.quantity,
            'Unit Price': item.unit_price_at_transaction,
            'Total Amount': item.total_amount,
            Reference: transaction.reference || '',
            'Performed By': transaction.performed_by,
            Status: transaction.status,
            Notes: transaction.notes || '',
          });
        });
      }
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 12 }, // Transaction ID
      { wch: 18 }, // Date
      { wch: 12 }, // Type
      { wch: 15 }, // SKU
      { wch: 10 }, // Quantity
      { wch: 12 }, // Unit Price
      { wch: 12 }, // Total Amount
      { wch: 15 }, // Reference
      { wch: 20 }, // Performed By
      { wch: 12 }, // Status
      { wch: 30 }, // Notes
    ];
    worksheet['!cols'] = columnWidths;

    // Apply conditional formatting (color coding by transaction type)
    // Note: XLSX doesn't support conditional formatting directly, but we can add a helper column
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = 1; row <= range.e.r; row++) {
      const typeCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 2 })]; // Type column (C)
      if (typeCell && typeCell.v === 'Stock In') {
        // Could add styling here if needed
      }
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    // Convert to base64
    const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const fileUri = getDocumentDirectory() + file;

    // Write file
    await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
      encoding: 'base64' as any,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Transactions Excel',
      });
    } else {
      return { success: false, error: 'Sharing is not available on this device' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Export transactions Excel error:', error);
    return { success: false, error: error?.message || 'Failed to export transactions to Excel' };
  }
}

export async function exportTransactionsToPDF(
  transactions: TransactionWithItems[],
  filename?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!transactions || transactions.length === 0) {
      return { success: false, error: 'No transactions to export' };
    }

    const file = filename || generateFilename('transactions', '.pdf');

    // Calculate summary stats
    const totalTransactions = transactions.length;
    let totalItems = 0;
    let totalValue = 0;
    transactions.forEach((t) => {
      const items = t.transaction_item || [];
      totalItems += items.length;
      totalValue += items.reduce((sum, item) => sum + item.total_amount, 0);
    });

    // Generate transaction sections
    let transactionsHTML = '';
    transactions.forEach((transaction) => {
      const transactionDate = format(new Date(transaction.timestamp), 'MMMM dd, yyyy HH:mm');
      const items = transaction.transaction_item || [];

      let itemsTable = '';
      if (items.length > 0) {
        const itemHeaders = ['SKU', 'Quantity', 'Unit Price', 'Total'];
        const itemRows = items.map((item) => [
          item.sku,
          String(item.quantity),
          formatCurrency(item.unit_price_at_transaction),
          formatCurrency(item.total_amount),
        ]);
        itemsTable = generateHTMLTable(itemHeaders, itemRows);
      }

      const typeColor =
        transaction.transaction_type === 'Stock In'
          ? '#10B981'
          : transaction.transaction_type === 'Stock Out'
          ? '#EF4444'
          : '#F59E0B';

      transactionsHTML += `
        <div style="margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <div>
              <h3 style="margin: 0; color: #1f2937;">Transaction #${transaction.id}</h3>
              <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">${transactionDate}</p>
            </div>
            <div style="background-color: ${typeColor}20; color: ${typeColor}; padding: 8px 16px; border-radius: 6px; font-weight: bold;">
              ${transaction.transaction_type}
            </div>
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Reference:</strong> ${transaction.reference || 'N/A'} | 
            <strong>Status:</strong> ${transaction.status} | 
            <strong>Performed By:</strong> ${transaction.performed_by}
          </div>
          ${items.length > 0 ? `<div style="margin-top: 15px;">${itemsTable}</div>` : '<p>No items in this transaction</p>'}
          ${transaction.notes ? `<p style="margin-top: 10px; color: #6b7280;"><strong>Notes:</strong> ${transaction.notes}</p>` : ''}
        </div>
      `;
    });

    // Generate HTML document
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              color: #1f2937;
              margin-bottom: 10px;
            }
            .summary {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .summary-item {
              display: inline-block;
              margin-right: 30px;
            }
            .summary-label {
              font-size: 12px;
              color: #6b7280;
            }
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background-color: #3b82f6;
              color: white;
              padding: 10px;
              text-align: left;
              font-weight: bold;
              font-size: 12px;
            }
            td {
              padding: 8px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
          </style>
        </head>
        <body>
          <h1>Transactions Export</h1>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Transactions</div>
              <div class="summary-value">${totalTransactions}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Items</div>
              <div class="summary-value">${totalItems}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Value</div>
              <div class="summary-value">${formatCurrency(totalValue)}</div>
            </div>
          </div>
          ${transactionsHTML}
          <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
            Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm')}
          </p>
        </body>
      </html>
    `;

    // Generate PDF
    const { uri } = await Print.printToFileAsync({ html });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Transactions PDF',
      });
    } else {
      return { success: false, error: 'Sharing is not available on this device' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Export transactions PDF error:', error);
    return { success: false, error: error?.message || 'Failed to export transactions to PDF' };
  }
}


