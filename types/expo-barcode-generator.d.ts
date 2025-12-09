declare module 'expo-barcode-generator' {
  import { Component } from 'react';

  export interface BarcodeOptions {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
    textPosition?: 'top' | 'bottom';
    textMargin?: number;
    background?: string;
    lineColor?: string;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    fontOptions?: string;
    text?: string;
  }

  export interface BarcodeProps {
    value: string;
    options?: BarcodeOptions;
    rotation?: number;
  }

  export const Barcode: React.FC<BarcodeProps>;
}

