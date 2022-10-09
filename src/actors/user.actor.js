const { randomUUID } = require("crypto");

module.exports = (messagebus) => {
    return messagebus.register({
        subscribe: {
            user: {
                articleRemoved({userId, articleId}) {
                    const shoppingCartId = `${userId}.shoppingCart`;
                    const cart = this.getPropertyDefault(shoppingCartId, []);
                    this.setProperty(shoppingCartId, cart.filter(item => item.id !== articleId));
                    this.publish('shoppingCartUpdated', { userId, shoppingCart: this.getProperty(shoppingCartId) });
                },
                articleAdded ({userId, article}) {
                    const shoppingCartId = `${userId}.shoppingCart`;
                    const userShoppingCart = this.getPropertyDefault(shoppingCartId, []);
                    this.setProperty(shoppingCartId, userShoppingCart.concat([article]));
                    this.publish('shoppingCartUpdated', { userId, shoppingCart: this.getProperty(shoppingCartId) });
                },
                createOrder({ userId, orderId }) {
                    const shoppingCartId = `${userId}.shoppingCart`;
                    const userShoppingCart = this.getProperty(shoppingCartId);
                    if (!userShoppingCart) {
                        this.send('error', new Error('Invalid or empty shopping cart'));
                    }
                    const order = {
                        userId,
                        id: orderId,
                        shoppingCart: [ ...userShoppingCart ],
                        date: new Date(),
                        total: userShoppingCart.reduce((acc, cur) => acc + cur.price, 0)
                    }
                    this.send('order', 'created', order);
                }
            }
        }
    });
}