const mainTemplate = require('./template/main.template');
const shopTemplate = require('./template/shop.template');
const headTemplate = require('./template/head.template');

module.exports = (messagebus) => {
    return messagebus.register({
        subscribe: {
            web: {
                renderIndex(req, res) {
                    const title = 'Hello World';
                    const content = mainTemplate({
                        content: shopTemplate({}),
                        title,
                        head: headTemplate({})
                    });
                    this.publish('response', req, res, {
                        content
                    });
                }
            }
        }
    });
}