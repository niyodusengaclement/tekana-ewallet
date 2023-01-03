export const PORT: number = +process.env.PORT || 9000;
export const DATABASE_URL = 'DATABASE_URL';
export const JWT_SECRET = 'JWT_SECRET';
export const NID_VALIDATOR_URL = 'NID_VALIDATOR_URL';
export const NATIONAL_IDENTIFICATION = 'NATIONAL_IDENTIFICATION';
export const TRANSACTION_STATUS: Array<string> = [
  'pending',
  'completed',
  'failed',
];

export const SMS_USER = 'SMS_USER';
export const SMS_PASSWORD = 'SMS_PASSWORD';
export const SMS_SENDER = 'SMS_SENDER';
