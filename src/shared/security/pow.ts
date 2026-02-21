/**
 * Модуль Proof-of-Work (PoW) challenge.
 * Клиент решает вычислительную задачу перед API-запросом,
 * что делает массовый парсинг экономически невыгодным.
 */

import { sha256 } from './crypto'

/** Сложность по умолчанию (количество ведущих нулей в hex-хеше) */
export const DEFAULT_DIFFICULTY = 3

/**
 * Решает PoW-задачу — находит nonce, при котором
 * SHA-256(challenge + ':' + nonce) начинается с заданного количества нулей.
 * @param challenge — строка-задание от сервера
 * @param difficulty — количество ведущих нулей в hex (по умолчанию 3 → '000')
 * @returns строковое представление найденного nonce
 */
export async function solveChallenge(
  challenge: string,
  difficulty: number = DEFAULT_DIFFICULTY,
): Promise<string> {
  const prefix = '0'.repeat(difficulty)
  let nonce = 0

  while (true) {
    const hash = await sha256(`${challenge}:${nonce}`)
    if (hash.startsWith(prefix)) {
      return String(nonce)
    }
    nonce++
  }
}

/**
 * Проверяет решение PoW-задачи.
 * @param challenge — строка-задание
 * @param nonce — предложенное решение
 * @param difficulty — требуемое количество ведущих нулей
 * @returns true если решение корректно
 */
export async function verifyChallengeSolution(
  challenge: string,
  nonce: string,
  difficulty: number = DEFAULT_DIFFICULTY,
): Promise<boolean> {
  if (!nonce) return false
  const prefix = '0'.repeat(difficulty)
  const hash = await sha256(`${challenge}:${nonce}`)
  return hash.startsWith(prefix)
}

/** Состояние PoW-токена на клиенте */
interface PowState {
  /** Challenge от сервера */
  challenge: string | null
  /** Решённый nonce */
  token: string | null
}

const state: PowState = {
  challenge: null,
  token: null,
}

/** Получить текущее состояние PoW */
export function getPowState(): Readonly<PowState> {
  return { challenge: state.challenge, token: state.token }
}

/** Сохранить решённый PoW-токен */
export function setPowToken(challenge: string, nonce: string): void {
  state.challenge = challenge
  state.token = nonce
}

/**
 * Использовать PoW-токен (одноразовый — после использования сбрасывается).
 * @returns объект с challenge и nonce, или null
 */
export function consumePowToken(): { challenge: string; nonce: string } | null {
  if (!state.challenge || !state.token) return null
  const result = { challenge: state.challenge, nonce: state.token }
  state.challenge = null
  state.token = null
  return result
}

/** Сброс состояния PoW (для тестов) */
export function resetPowState(): void {
  state.challenge = null
  state.token = null
}
