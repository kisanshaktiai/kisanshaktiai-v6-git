export const DEFAULT_TENANT_ID = "66372c6f-c996-4425-8749-a7561e5d6ae3";

export const STORAGE_KEYS = {
  TENANT_ID: 'tenant_id',
  USER_PROFILE: 'user_profile',
  AUTH_TOKEN: 'auth_token',
  FARMER_DATA: 'farmer_data',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  MOBILE_NUMBER: 'mobile_number',
  PIN_HASH: 'pin_hash',
  USER_ID: 'user_id',
  USER_METADATA: 'user_metadata',
  OTP_PREFIX: 'otp_',
  OTP_TIMESTAMP_PREFIX: 'otp_timestamp_',
};

export const APP_CONFIG = {
  DEFAULT_LANGUAGE: 'hi',
  SUPPORTED_LANGUAGES: ['hi', 'en', 'mr'],
  API_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

export const FARMER_REGISTRATION = {
  MOBILE_REGEX: /^[6-9]\d{9}$/,
  PIN_LENGTH: 4,
  OTP_LENGTH: 6,
  DEFAULT_TENANT: DEFAULT_TENANT_ID,
};
