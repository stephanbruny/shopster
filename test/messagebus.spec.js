const assert = require('assert');
const Messagebus = require('../src/messagebus');

describe('Messagebus', () => {
    it('should publish and receive messages', (done) => {
        const messagebus = Messagebus(['foo', 'bar']);
        messagebus.subscribe('foo', 'test', (data) => {
            assert.strictEqual(data, 'foobar');
            done();
        });
        messagebus.publish('foo', 'test', 'foobar');
    });

    it('should register actors', (done) => {
        const messagebus = Messagebus(['foo', 'bar']);

        const actor = messagebus.register({
            subscribe: {
                foo: {
                    test(data) {
                        assert.deepStrictEqual(data, { foo: 42 });
                        this.rofl();
                        this.publish('finish', true);
                    },
                    finish(data) {
                        assert.strictEqual(data, true);
                        assert.strictEqual(this.getProperty('lol'), 42);
                        done();
                    }
                }
            },
            actions: {
                rofl() {
                    this.setProperty('lol', 42);
                }
            }
        });

        messagebus.publish('foo', 'test', { foo: 42 });
    });

    it('should log messages', () => {
        const log = [];
        const messagebus = Messagebus(['foo', 'bar', 'baz'], (item) => log.push(item));
        messagebus.publish('foo', 'test', { foo: 42 });
        messagebus.publish('bar', 'test', { bar: 42 });
        messagebus.publish('baz', 'rofl', { baz: 'xyz' });
        assert.deepStrictEqual(log, [
            { channel: 'foo', message: 'test', content: [{ foo: 42 }] },
            { channel: 'bar', message: 'test', content: [{ bar: 42 }] },
            { channel: 'baz', message: 'rofl', content: [{ baz: 'xyz' }] },
        ])
    });
});