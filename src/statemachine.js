const { EventEmitter } = require('events');

module.exports = function(config) {
    if (!config.initial) 
        throw new Error('State machine config missing "initial" state');
    const emitter = new EventEmitter();
    const statemachine = {
        state: config.initial,
        emit(message, ...args) {
            return emitter.emit(message, ...args);
        },
        enter(stateName, ...args) {
            if (!config[stateName]) 
                throw new Error(`Invalid state "${stateName}"`);
            this.state = config[stateName];
            return this.state.entry.bind(this)(...args);
        },
        send(message, content) {
            if (message === 'entry')
                throw new Error(`"entry" is reserved for internal use only`);
            if (!this.state[message]) return;
            const fn = this.state[message].bind(this);
            return fn(content)
        }
    }
    const reset = () => statemachine.enter('initial');
    return {
        on: emitter.on.bind(emitter),
        off: emitter.off.bind(emitter),
        addListener: emitter.addListener.bind(emitter),
        removeListener: emitter.removeListener.bind(emitter),
        send(message, content) {
            return statemachine.send(message, content);
        },
        reset
    };
}