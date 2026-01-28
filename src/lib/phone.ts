import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js';

/**
 * Normalize a phone number to E.164 format
 * @param input - Phone number string in any format
 * @param defaultCountry - Default country code (defaults to US)
 * @returns E.164 formatted phone number (e.g., +15555551234)
 * @throws Error if phone number is invalid
 */
export function normalizePhone(input: string, defaultCountry: CountryCode = 'US'): string {
  try {
    const parsed = parsePhoneNumber(input, defaultCountry);

    if (!parsed?.isValid()) {
      throw new Error('Invalid phone number');
    }

    return parsed.format('E.164');
  } catch (error) {
    throw new Error(`Invalid phone number: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format an E.164 phone number for display
 * @param e164 - Phone number in E.164 format
 * @returns National formatted phone number (e.g., (555) 555-1234)
 */
export function formatForDisplay(e164: string): string {
  try {
    const parsed = parsePhoneNumber(e164);
    return parsed.formatNational();
  } catch (error) {
    // If parsing fails, return the original
    return e164;
  }
}

/**
 * Validate a phone number without normalizing
 * @param input - Phone number string
 * @param defaultCountry - Default country code
 * @returns true if valid, false otherwise
 */
export function isValidPhone(input: string, defaultCountry: CountryCode = 'US'): boolean {
  try {
    const parsed = parsePhoneNumber(input, defaultCountry);
    return parsed?.isValid() ?? false;
  } catch {
    return false;
  }
}
