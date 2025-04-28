export const tryParseJson = (str: any) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return {};
  }
};
export const formatErrorYup = (errorYup: any) => {
  const errors: Record<string, Array<{ id: string; message: string }>> = {};

  errorYup.inner.forEach((error: any) => {
    if (error.path !== undefined) {
      errors[error.path] = error.errors.map((message: string) => ({
        id: message,
        message,
      }));
    }
  });

  return errors;
};
export function generateOTP(length: number): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}
