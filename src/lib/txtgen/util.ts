// utils

import { adjectives, nouns, vowels } from './sample'

let random: () => number

export const setRandom = (newRandom: () => number): void => {
  random = newRandom
}

setRandom(Math.random)

export const randfloat = (): number => random()

export const randint = (min: number, max: number): number => {
  const offset = min
  const range = max - min + 1
  return Math.floor(randfloat() * range) + offset
}

export const rand = (a: string[]): string => {
  let w
  while (!w) {
    w = a[randint(0, a.length - 1)]
  }
  return w
}

export const pickLastPunc = (): string => {
  const a = '.......!?!?;...'.split('')
  return rand(a)
}

export const pluralize = (w: string): string => {
  let word = w
  if (word.endsWith('s')) {
    return word
  }
  if (word.match(/(ss|ish|ch|x|us)$/)) {
    word += 'e'
  } else if (word.endsWith('y') && !vowels.includes(word.charAt(word.length - 2))) {
    word = word.slice(0, word.length - 1)
    word += 'ie'
  }
  return `${word}s`
}

export const normalize = (word: string): string => {
  let a = 'a'
  if (word.match(/^(a|e|heir|herb|hour|i|o)/)) {
    a = 'an'
  }
  return `${a} ${word}`
}

export const generator = {
  noun: () => {
    return rand(nouns)
  },
  a_noun: () => {
    return normalize(rand(nouns))
  },
  nouns: () => {
    return pluralize(rand(nouns))
  },
  adjective: () => {
    return rand(adjectives)
  },
  an_adjective: () => {
    return normalize(rand(adjectives))
  },
}
