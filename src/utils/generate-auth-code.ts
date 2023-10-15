export default function generateAuthCode(length = 6, characters = '0123456789'): string {
  let result = ''
  const charactersLength = characters.length
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}
