const Server = require('./server-actor');
const Messagebus = require('./messagebus');
const Page = require('./page');

const messagebus = Messagebus(['web', 'page']);

const pageActor = Page(messagebus);

messagebus.register({
    subscribe: {
        web: {
            index(req, res) {
                this.publish('renderIndex', req, res);
            },
            'favicon.ico'(req, res) {
                return this.publish('favIcon', req, res);
            },
            hello(req, res) {
                return res.send('Hello World');
            },
            notFound(req, res) {
                return res.status(404).send('404 - Not Found');
            },
            response(req, res, responseData) {
                res
                    .status(responseData.status || 200)
                    .type(responseData.type || 'text/html')
                    .send(responseData.content)
            },
            __unhandled(req, res) {
                return this.publish('notFound', req, res);
            }
        }
    }
});

Server(messagebus).catch(ex => console.error(ex));