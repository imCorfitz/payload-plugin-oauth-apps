/**
 * This is copied from the txtgen package, which caused errors when trying to import it.
 * https://github.com/ndaidong/txtgen
 */

// main

import { phrases, sentenceTemplates } from './sample'
import { generator, pickLastPunc, rand, randfloat, randint, setRandom } from './util'

export {
  addAdjectives,
  addNouns,
  addTemplates,
  getAdjectives,
  getNouns,
  getTemplates,
  setAdjectives,
  setNouns,
  setTemplates,
} from './sample'

const actions = ['noun', 'a_noun', 'nouns', 'adjective', 'an_adjective']

const trim = (s: string): string => {
  return s
    .replace(/^[\s\xa0]+|[\s\xa0]+$/g, '')
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\s\s+|\r/g, ' ')
}

const make = (template: string): string => {
  let sentence = template
  const occurrences = template.match(/\{\{(.+?)\}\}/g)

  if (occurrences?.length) {
    for (const occurrence of occurrences) {
      const action = trim(occurrence.replace('{{', '').replace('}}', ''))
      let result = ''
      if (actions.includes(action)) {
        result = generator[action as keyof typeof generator]()
      }
      sentence = sentence.replace(occurrence, result)
    }
  }
  return sentence
}

const randomStartingPhrase = (): string => {
  if (randfloat() < 0.33) {
    return rand(phrases)
  }
  return ''
}

const makeSentenceFromTemplate = (): string => {
  return make(rand(sentenceTemplates))
}

export { setRandom }

export const sentence = (ignoreStartingPhrase = false, ignoreLastPunctuation = false): string => {
  const phrase = ignoreStartingPhrase ? '' : randomStartingPhrase()
  let s = phrase + makeSentenceFromTemplate()
  s = s.charAt(0).toUpperCase() + s.slice(1)
  if (!ignoreLastPunctuation) {
    s += pickLastPunc()
  }
  return s
}

export const paragraph = (len = 0): string => {
  let length = len
  if (!length) {
    length = randint(3, 10)
  }
  const t = Math.min(length, 15)
  const a = []
  while (a.length < t) {
    const s = sentence()
    a.push(s)
  }
  return a.join(' ')
}

export const article = (len = 0): string => {
  let length = len
  if (!length) {
    length = randint(3, 10)
  }
  const t = Math.min(length, 15)
  const a = []
  while (a.length < t) {
    const s = paragraph()
    a.push(s)
  }
  return a.join('\n\n')
}
