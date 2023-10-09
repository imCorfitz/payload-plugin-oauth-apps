/**
 * Simple object check.
 * @param item - The item to check.
 * @returns \{boolean\} - True if item is an object.
 */
// typescript Check if is type of object
function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item))
}

/**
 * Deep merge two objects.
 * @param target - The target object.
 * @param source - The source objects (...sources)
 */
export default function deepMerge<T extends object, R>(target: T, source: R): T {
  const output = { ...target }
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          ;(output as Record<string, unknown>)[key] = deepMerge(target[key] as object, source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }

  return output
}
