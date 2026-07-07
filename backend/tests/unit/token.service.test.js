const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, generateOtp } = require('../../src/modules/auth/token.service')

describe('token.service', () => {
  const mockUser = { id: 'user-id-123', businessId: 'biz-id-456', branchId: 'branch-id-789', roleId: 'role-id-abc' }

  describe('signAccessToken', () => {
    it('returns a non-empty JWT string', () => {
      const token = signAccessToken(mockUser)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT format: header.payload.signature
    })

    it('encodes businessId and sub in the payload', () => {
      const token = signAccessToken(mockUser)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      expect(payload.sub).toBe(mockUser.id)
      expect(payload.businessId).toBe(mockUser.businessId)
    })

    it('uses a custom branchId when provided', () => {
      const token = signAccessToken(mockUser, 'custom-branch')
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      expect(payload.branchId).toBe('custom-branch')
    })
  })

  describe('signRefreshToken / verifyRefreshToken', () => {
    it('round-trips: sign → verify returns correct userId', () => {
      const token = signRefreshToken(mockUser)
      const decoded = verifyRefreshToken(token)
      expect(decoded.sub).toBe(mockUser.id)
    })

    it('throws for a tampered refresh token', () => {
      const token = signRefreshToken(mockUser)
      expect(() => verifyRefreshToken(token + 'tampered')).toThrow()
    })
  })

  describe('hashToken', () => {
    it('produces a deterministic 64-char hex string', () => {
      const hash = hashToken('my-raw-token')
      expect(hash).toHaveLength(64)
      expect(hashToken('my-raw-token')).toBe(hash) // deterministic
    })

    it('different inputs produce different hashes', () => {
      expect(hashToken('token-a')).not.toBe(hashToken('token-b'))
    })
  })

  describe('generateOtp', () => {
    it('produces a 6-digit numeric string by default', () => {
      const otp = generateOtp()
      expect(otp).toHaveLength(6)
      expect(/^\d+$/.test(otp)).toBe(true)
    })

    it('respects custom length', () => {
      expect(generateOtp(4)).toHaveLength(4)
      expect(generateOtp(8)).toHaveLength(8)
    })
  })
})
