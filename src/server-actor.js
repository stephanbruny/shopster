const Fasitfy = require('fastify');
const Messagebus = require('./messagebus');

const defaultServerConfiguration = {
    logger: false,
    port: 1337,
    channel: 'web'
}

/**
 * Create a webserver
 * @param {defaultServerConfiguration} config 
 * @param {Messagebus} messagebus 
 */
module.exports = async function(messagebus, config = defaultServerConfiguration) {
    const server = Fasitfy({
        logger: config.logger
    });

    server.get('/:primary/:secondary?', async (req, res) => { // TODO: Listen ALL reuests
        const message = Object.entries(req.params).map(([key, value]) => value || 'index').join('/');
        const ok = messagebus.publish(config.channel, message, req, res);
        if (!ok) {
            const errorHandler = messagebus.publish(config.channel, 'notFound', req, res);
            if (!errorHandler)
                return res.status(404).send('Not found');
        }
    });
    return server.listen({ port: config.port });
}