import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * Hashes a plain-text PIN.
 * @param pin The plain-text PIN to hash.
 * @returns A promise that resolves to the hashed PIN.
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  const hash = await bcrypt.hash(pin, salt)
  return hash
}

/**
 * Verifies a plain-text PIN against a hash.
 * @param pin The plain-text PIN to verify.
 * @param hash The hash to compare against.
 * @returns A promise that resolves to true if the PIN is valid, false otherwise.
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}
