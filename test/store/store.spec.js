const assert = require('assert');
const Store = require('../../src/store/store');

describe('Store (base) module', () => {
    it('should set and get data', () => {
        const testStore = Store();
        testStore.set('foo', 'asdf');
        testStore.set('bar', 42);
        assert(testStore.get('foo'), 'asdf');
        assert(testStore.get('bar'), 42);
    });

    it('should initialize from object data', () => {
        const initData = {
            foo: 'foo',
            bar: 42,
            baz: {
                asdf: 'rofl'
            }
        }
        const testStore = Store(initData);
        assert.strictEqual(testStore.get('foo'), 'foo');
        assert.strictEqual(testStore.get('bar'), 42);
        assert.deepStrictEqual(testStore.get('baz'), {
            asdf: 'rofl'
        });
    });

    it('should remove entries', () => {
        const initData = {
            foo: 'foo',
            bar: 42,
            baz: {
                asdf: 'rofl'
            }
        }
        const testStore = Store(initData);
        testStore.remove('bar');
        assert.deepStrictEqual(testStore.list(), {
            foo: 'foo',
            baz: {
                asdf: 'rofl'
            }
        })
    });
});