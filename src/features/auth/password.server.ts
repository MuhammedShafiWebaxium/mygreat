import 'server-only'
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64
const COST = 16_384

function scrypt(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(password, salt, KEY_LENGTH, { N: COST, r: 8, p: 1 }, (error, key) => {
      if (error) reject(error)
      else resolve(key as Buffer)
    })
  })
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt)
  return `scrypt$${COST}$${salt.toString('base64url')}$${key.toString('base64url')}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, cost, saltValue, keyValue] = storedHash.split('$')
  if (algorithm !== 'scrypt' || Number(cost) !== COST || !saltValue || !keyValue) return false
  const expected = Buffer.from(keyValue, 'base64url')
  const actual = await scrypt(password, Buffer.from(saltValue, 'base64url'))
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
