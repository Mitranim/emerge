import * as t from './utils.mjs'
import * as e from '../emerge.mjs'

t.is(e.is(), true)
t.is(e.is(null, undefined), false)
t.is(e.is(1, 1), true)
t.is(e.is(NaN, NaN), true)
t.is(e.is(-0, +0), true)
t.is(e.is('1', 1), false)
t.is(e.is({}, {}), false)

t.is(e.equal([], []), true)
t.is(e.equal({}, {}), true)
t.is(e.equal({}, []), false)
t.is(e.equal(Object.create(null), Object.create(null)), true)
t.is(e.equal(Object.create({}), Object.create({})), false)

// Known problem: ignores symbol keys; artifact of `for .. in`. Would prefer to
// not ignore them, but unsure if the expense is justified.
t.is(e.equal({[Symbol.for('one')]: 10}, {[Symbol.for('one')]: 10}), true)
t.is(e.equal({},                        {[Symbol.for('one')]: 10}), true)
t.is(e.equal({[Symbol.for('one')]: 10}, {}),                        true)

t.is(
  e.equal(
    {one: {two: {three: NaN}}, four: [4, 4], five: 'five'},
    {one: {two: {three: NaN}}, four: [4, 4], five: 'five'},
  ),
  true,
)

t.is(
  e.equal(
    {one: {two: {three: NaN}}, four: [4, 4], five: 'five'},
    {one: {two: {three: NaN}}, four: [4, 4], five: 'five', six: 6},
  ),
  false,
)

// Should add an example of an equality function with support for arbitrary types.

t.is(e.equalBy([1],     [1],     e.is),    true)
t.is(e.equalBy([1, {}], [1, {}], e.is),    false)
t.is(e.equalBy([1, {}], [1, {}], e.equal), true)
