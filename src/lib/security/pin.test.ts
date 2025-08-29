import { describe, it, expect } from 'vitest'
import { hashPin, verifyPin } from './pin'

describe('PIN Security', () => {
  it('should hash a PIN and then successfully verify it', async () => {
    const pin = '1234'
    const hashedPin = await hashPin(pin)

    // Expect hash to be a non-empty string and different from the original PIN
    expect(hashedPin).toBeTypeOf('string')
    expect(hashedPin).not.toBe(pin)
    expect(hashedPin.length).toBeGreaterThan(0)

    // Expect verification to succeed with the correct PIN
    const isVerified = await verifyPin(pin, hashedPin)
    expect(isVerified).toBe(true)
  })

  it('should fail to verify an incorrect PIN', async () => {
    const pin = '1234'
    const incorrectPin = '5678'
    const hashedPin = await hashPin(pin)

    // Expect verification to fail with the incorrect PIN
    const isVerified = await verifyPin(incorrectPin, hashedPin)
    expect(isVerified).toBe(false)
  })
})
