import { describe, it, expect, beforeEach } from 'vitest'
import {
  solveChallenge,
  verifyChallengeSolution,
  getPowState,
  setPowToken,
  consumePowToken,
  resetPowState,
  DEFAULT_DIFFICULTY,
} from '../pow'

describe('pow (Proof-of-Work)', () => {
  beforeEach(() => {
    resetPowState()
  })

  describe('solveChallenge', () => {
    it('находит nonce, при котором SHA-256 начинается с нужного количества нулей', async () => {
      const challenge = 'test-challenge-123'
      const difficulty = 2 // '00' — быстро для тестов
      const nonce = await solveChallenge(challenge, difficulty)

      expect(typeof nonce).toBe('string')
      expect(Number(nonce)).toBeGreaterThanOrEqual(0)
    })

    it('решение проходит верификацию', async () => {
      const challenge = 'verify-me'
      const difficulty = 2
      const nonce = await solveChallenge(challenge, difficulty)

      const isValid = await verifyChallengeSolution(challenge, nonce, difficulty)
      expect(isValid).toBe(true)
    })

    it('неверный nonce не проходит верификацию', async () => {
      const isValid = await verifyChallengeSolution('challenge', 'wrong-nonce', 2)
      expect(isValid).toBe(false)
    })

    it('решает задачу с дефолтной сложностью', async () => {
      const challenge = 'default-difficulty'
      const nonce = await solveChallenge(challenge)

      const isValid = await verifyChallengeSolution(challenge, nonce, DEFAULT_DIFFICULTY)
      expect(isValid).toBe(true)
    })
  })

  describe('verifyChallengeSolution', () => {
    it('возвращает true для корректного решения', async () => {
      const challenge = 'abc'
      const nonce = await solveChallenge(challenge, 1)
      expect(await verifyChallengeSolution(challenge, nonce, 1)).toBe(true)
    })

    it('возвращает false для пустого nonce', async () => {
      expect(await verifyChallengeSolution('abc', '', 1)).toBe(false)
    })

    it('возвращает false для неверного challenge', async () => {
      const nonce = await solveChallenge('real', 2)
      expect(await verifyChallengeSolution('fake', nonce, 2)).toBe(false)
    })
  })

  describe('состояние PoW-токена', () => {
    it('начальное состояние — токен отсутствует', () => {
      const state = getPowState()
      expect(state.token).toBeNull()
      expect(state.challenge).toBeNull()
    })

    it('setPowToken сохраняет токен', () => {
      setPowToken('challenge-1', 'nonce-42')
      const state = getPowState()
      expect(state.token).toBe('nonce-42')
      expect(state.challenge).toBe('challenge-1')
    })

    it('consumePowToken возвращает и сбрасывает токен', () => {
      setPowToken('ch', 'n')
      const result = consumePowToken()
      expect(result).toEqual({ challenge: 'ch', nonce: 'n' })
      expect(getPowState().token).toBeNull()
    })

    it('consumePowToken возвращает null если токена нет', () => {
      expect(consumePowToken()).toBeNull()
    })

    it('resetPowState сбрасывает всё', () => {
      setPowToken('ch', 'n')
      resetPowState()
      expect(getPowState().token).toBeNull()
      expect(getPowState().challenge).toBeNull()
    })
  })
})
