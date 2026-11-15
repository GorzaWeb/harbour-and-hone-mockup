// Run: node test/slots.test.js
const assert = require('assert');
const { slotsFor, serviceAllowed, fmt } = require('../js/slots.js');

assert.deepStrictEqual(slotsFor(1, 30), [], 'Monday is closed');
assert.strictEqual(slotsFor(2, 30)[0].value, '9:00am', 'Tuesday opens 9am');
assert.strictEqual(slotsFor(2, 30).at(-1).value, '6:00pm', '30 min must finish by 6:30pm');
assert.strictEqual(slotsFor(4, 60).at(-1).value, '7:00pm', 'late Thursday, 60 min ends 8pm');
assert.strictEqual(slotsFor(6, 30)[0].value, '8:30am', 'Saturday opens 8:30am');
assert.strictEqual(slotsFor(0, 40).at(-1).value, '2:00pm', '40 min on Sunday ends before 3pm');
assert.ok(serviceAllowed('senior', 3) && !serviceAllowed('senior', 5), 'Senior Cut Tue-Thu only');
assert.ok(serviceAllowed('fade', 0), 'other services any open day');
assert.strictEqual(fmt(720), '12:00pm');
console.log('slots: all tests passed');
