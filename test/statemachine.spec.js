const assert = require('assert');
const Statemachine = require('../src/statemachine');

describe('State Machine', () => {
    it('should execute state transitions', () => {
        const testState = {};
        const stateMachineConfig = {
            initial: {
                entry() {
                    testState.initialized = true;
                },
                fooed(ev) {
                    this.enter('foo', ev);
                }
            },
            foo: {
                entry(ev) {
                    testState.foo = ev;
                },
                bared(ev) {
                    this.enter('bar', ev);
                }
            },
            bar: {
                entry(ev) {
                    testState.bar = ev;
                }
            }
        };

        const machine = Statemachine(stateMachineConfig);
        machine.reset();
        machine.send('fooed', { foo: 42 });
        machine.send('bared', { bar: 'asdf' });
        assert.strictEqual(testState.initialized, true);
        assert.deepStrictEqual(testState.foo, { foo: 42 });
        assert.deepStrictEqual(testState.bar, { bar: 'asdf' });
    });

    it('should fail on invalid or missing config', () => {
        assert.throws(() => {
            Statemachine();
        });

        assert.throws(() => {
            Statemachine({});
        });

        assert.throws(() => {
            Statemachine({
                foo: {
                    bar() {}
                }
            });
        });
    });

    it('should fail on entry call', () => {
        const machine = Statemachine({
            initial: {
                entry() {
                    
                }
            }
        });

        assert.throws(() => {
            machine.send('entry', 42);
        })
    });
});