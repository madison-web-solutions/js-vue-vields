import type { PasswordStrengthProvider } from 'vue-fields-ms'

export const passwordStrengthProvider: PasswordStrengthProvider = {
  maxStrength: 4,

  async check(password: string): Promise<number> {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  },
}
