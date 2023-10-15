export default function generateSecretString() {
  let ret = ''
  for (let i = 0; i < 8; i++) {
    const newrand = Math.floor(Math.random() * 4026531840) + 268435456
    ret += newrand.toString(16)
  }
  return ret
}
