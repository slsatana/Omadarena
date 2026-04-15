import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EskizService {
  private readonly logger = new Logger(EskizService.name);
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  private get authPayload() {
    return {
      email: process.env.ESKIZ_EMAIL || 'test@example.com',
      password: process.env.ESKIZ_PASSWORD || 'secret',
    };
  }

  async sendSms(phone: string, text: string): Promise<boolean> {
    try {
      if (!process.env.ESKIZ_EMAIL) {
        this.logger.warn(`Eskiz SMS is NOT configured. Mock sending SMS to ${phone}: ${text}`);
        return true; 
      }

      await this.ensureToken();

      await axios.post(
        'https://notify.eskiz.uz/api/message/sms/send',
        {
          mobile_phone: phone.replace(/\D/g, ''), // Strip non-digits
          message: text,
          from: '4546', // default Eskiz sender
        },
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      );
      return true;
    } catch (e) {
      this.logger.error('Error sending SMS via Eskiz', e);
      return false;
    }
  }

  private async ensureToken() {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return;
    }
    const res = await axios.post('https://notify.eskiz.uz/api/auth/login', this.authPayload);
    this.token = res.data.data.token;
    this.tokenExpiresAt = Date.now() + 1000 * 60 * 60 * 24 * 28; // ~28 days validity
  }
}
