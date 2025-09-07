import QRCode from 'qrcode';
import { logger } from './logger';

export class QRCodeGenerator {
  async generateQRCode(url: string, siteId: string): Promise<string> {
    try {
      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      // Return the data URL directly
      return qrCodeDataUrl;
    } catch (error) {
      logger.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  async generateQRCodeBuffer(url: string): Promise<Buffer> {
    try {
      const qrCodeBuffer = await QRCode.toBuffer(url, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
      
      return qrCodeBuffer;
    } catch (error) {
      logger.error('Error generating QR code buffer:', error);
      throw new Error('Failed to generate QR code');
    }
  }
}

export const qrGenerator = new QRCodeGenerator();