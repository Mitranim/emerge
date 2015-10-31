'use strict'

const secret = typeof Symbol === 'function' ? Symbol() : (Math.random() * Math.pow(10, 16)).toString(16)

// Dirty hack to track the value that needs to be replaced rather than merged
// when doing a deep patch.
let setNext = secret

/**
 * Reading
 */

exports.readAtPath = readAtPath
function readAtPath (tree, path) {
  if (!(path instanceof Array)) throw Error(`path must be an array, got: ${path}`)
  if (!path.length) return tree

  let i = -1
  while (++i < path.length) {
    if (isPrimitive(tree)) return undefined
    const key = path[i]
    tree = tree[key]
  }

  return tree
}

/**
 * Writing
 */

exports.replaceAtRoot = replaceAtRoot
function replaceAtRoot (prev, next) {
  const value = replaceIfNotPatchable(prev, next)
  if (value !== secret) return value

  // This check may be redundant on recursive invocations, potentially makes the
  // algorithm inefficient for patching large trees from root. Should optimise.
  if (deepEqual(prev, next)) return prev

  // Keep as much of the old structure as possible (same references) and replace
  // the rest.
  const buffer = {}
  Object.keys(next).forEach(key => {
    buffer[key] = replaceAtRoot(prev[key], next[key])
  })
  return Object.freeze(buffer)
}

exports.mergeAtRoot = mergeAtRoot
function mergeAtRoot (prev, next) {
  const value = replaceIfNotPatchable(prev, next)
  if (value !== secret) return value

  const partial = {}
  Object.keys(next).forEach(key => {
    const value = mergeAtRoot(prev[key], next[key])
    if (!is(prev[key], value)) partial[key] = value
  })

  const keys = Object.keys(partial)
  if (keys.length) {
    const buffer = {}
    Object.keys(prev).forEach(key => {buffer[key] = prev[key]})
    Object.keys(partial).forEach(key => {buffer[key] = partial[key]})
    return Object.freeze(buffer)
  }

  return prev
}

exports.replaceAtPath = replaceAtPath
function replaceAtPath (prev, next, path) {
  if (!(path instanceof Array)) throw Error(`path must be an array, got: ${path}`)
  if (!path.length) return replaceAtRoot(prev, next)

  const patch = {}
  let step = patch
  path.forEach((key, index) => {
    step = step[key] = index < path.length - 1 ? {} : next
  })
  setNext = next
  return mergeAtRoot(prev, patch)
}

/**
 * Utils
 */

function replaceIfNotPatchable (prev, next) {
  if (prev === next) return prev
  if (isPrimitive(prev)) return cloneDeep(next)
  if (isPrimitive(next)) return next
  if (prev instanceof Array) {
    return deepEqual(prev, next) ? prev : cloneDeep(next)
  }
  if (next === setNext) {
    setNext = secret
    return replaceAtRoot(prev, next)
  }
  return secret
}

exports.deepEqual = deepEqual
function deepEqual (one, other) {
  if (isPrimitive(one) && isPrimitive(other)) return is(one, other)
  if (isPrimitive(one) !== isPrimitive(other)) return false
  if (typeof one === 'function' && typeof other === 'function') return one === other
  if (one instanceof Array !== other instanceof Array) return false

  // Array. Ignore non-array properties.
  if (one instanceof Array && other instanceof Array) {
    if (one.length !== other.length) return false
    return one.every((value, index) => deepEqual(value, other[index]))
  }

  // Any other object.
  const keys = Object.keys(one)
  if (keys.length !== Object.keys(other).length) return false
  return keys.every(key => key in other && deepEqual(one[key], other[key]))
}

function isPrimitive (value) {
  return value == null || typeof value !== 'object' && typeof value !== 'function'
}

// ≈ SameValueZero from ES spec.
function is (one, other) {
  return one === other || one !== one && other !== other  // eslint-disable-line
}

// Makes an immutable deep clone.
function cloneDeep (value) {
  if (isPrimitive(value)) return value

  // Ignore non-array properties.
  if (value instanceof Array) return Object.freeze(value.map(cloneDeep))

  const buffer = {}
  Object.keys(value).forEach(key => {
    buffer[key] = cloneDeep(value[key])
  })
  return Object.freeze(buffer)
}

exports.immute = immute
function immute (value) {
  if (isPrimitive(value)) return value
  if (value instanceof Array) {
    // Ignore non-array properties.
    value.forEach(immute)
  } else {
    Object.keys(value).forEach(key => {immute(value[key])})
  }
  return Object.freeze(value)
}