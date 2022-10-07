const { randomUUID } = require('crypto');
const { EventEmitter } = require('events');

module.exports = function(channelNames = [], log) {
    const createChannel = (name) => new EventEmitter();

    const channels = channelNames.reduce((acc, channel) => ({
        ...acc,
        [channel]: createChannel(channel)
    }), {});

    const getChannelOrFail = (name) => {
        if (!channels[name]) throw new Error(`Invalid channel: ${name}`);
        return channels[name];
    }

    /**
     * Publish a message onto the messagebus
     * @param {string} channel 
     * @param {string} message 
     * @param  {...any} contents 
     * @returns {boolean} true on successful emit, false on missing listener(s)
     */
    function publish(channelName, message, ...contents) {
        if (log) log({ channel: channelName, message, content: contents });
        const channel = getChannelOrFail(channelName);
        const isSent = channel.emit(message, ...contents);
        if (!isSent) channel.emit('__unhandled', ...contents);
        return isSent;
    }

    function subscribe(channel, message, callback) {
        return getChannelOrFail(channel).addListener(message, callback);
    }

    function unsubscribe(channel, message, callback) {
        return getChannelOrFail(channel).removeListener(message, callback);
    }

    return {
        publish,

        subscribe,

        unsubscribe,

        register(actor = {}) {
            const actorChannels = actor.subscribe;

            const reduceObject = (obj, callback, baseObject) => Object.entries(obj).reduce((acc, [key, item]) => {
                const result = callback(key, item, acc);
                return {
                    ...acc,
                    ...result
                }
            }, baseObject || {});

            const actorInstance = reduceObject(actorChannels, (channel, messageItem, acc) => {
                const baseActor = {
                    ...actor.actions,
                    _id: randomUUID(),
                    state: new Map(),
                    setProperty(key, value) {
                        this.state.set(key, value);
                    },
                    getProperty(key) {
                        return this.state.get(key);
                    },
                    getPropertyDefault(key, defaultValue) {
                        const result = this.state.get(key);
                        if (!result) {
                            this.setProperty(key, defaultValue);
                        }
                        return this.getProperty(key);
                    },
                    publish (msg, ...contents) {
                        return publish(channel, msg, ...contents);
                    },
                    send: publish
                };
                const channelHandlers = reduceObject(messageItem, (message, handler, channelAcc) => {
                    return {
                        ...channelAcc,
                        [message]: subscribe(channel, message, handler.bind(channelAcc).bind(actor.actions))
                    }
                }, baseActor);
                return {
                    ...acc,
                    [channel]: channelHandlers
                }
            }, {});

            return actorInstance;
        }
    }
}