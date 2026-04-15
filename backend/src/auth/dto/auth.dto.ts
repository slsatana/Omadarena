export class SendSmsDto {
  phone: string;
}

export class VerifySmsDto {
  phone: string;
  code: string;
  deviceId: string;
  displayName?: string;
}
