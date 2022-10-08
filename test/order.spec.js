const Messagebus = require('../src/messagebus');
const UserActor = require('../src/actors/user.actor');
const { randomUUID } = require("crypto");

describe('Ordering', () => {
    const randomArticle = (title, maxPrice = 100) => ({
        id: randomUUID(),
        gtin: randomUUID(),
        price: toFixedPrice(Math.random() * maxPrice),
        title
    });
    const toFixedPrice = n => parseFloat(n.toFixed(2));
    it('should order multiple articles and give discount on price above 100', () => {
        const messagebus = Messagebus(['user', 'order']);


        const testArticle = {
            id: randomUUID(),
            gtin: randomUUID(),
            price: toFixedPrice(Math.random() * 100),
            title: 'T-Shirt Warstars Teal M',
        };

        const actor = UserActor(messagebus);

        const discountActor = messagebus.register({
            subscribe: {
                user: {
                    shoppingCartUpdated({userId, shoppingCart}) {
                        const total = toFixedPrice(shoppingCart
                            .filter(item => !item.specialDiscount)
                            .reduce((acc, cur) => acc + cur.price, 0)
                        );
                        if (total > 100) {
                            const discountItem = shoppingCart.find(item => item.specialDiscount);
                            if (discountItem) {
                                if (total === discountItem.oldPrice) return;
                                return this.publish('articleRemoved', { userId, articleId: discountItem.id });
                            }
                            this.publish('articleAdded', { userId, article: {
                                specialDiscount: true,
                                id: randomUUID(),
                                title: 'Special Discount 10%',
                                price: toFixedPrice(-total * 0.1),
                                oldPrice: toFixedPrice(total)
                            }});
                        }
                    }
                }
            }
        });

        messagebus.publish('user', 'articleAdded', { userId: 'user-1', article: testArticle });
        messagebus.publish('user', 'articleAdded', { userId: 'user-1', article: randomArticle('Uncle Bobs flanell M') });
        messagebus.publish('user', 'articleAdded', { userId: 'user-1', article: randomArticle('Basic Shirt Black M') });
        messagebus.publish('user', 'finalizeOrder', { userId: 'user-1' });
        console.log(actor.user.state)
    });

    it('should complete an order with payment', () => {
        const messagebus = Messagebus(['user', 'order']);
        const actor = UserActor(messagebus);
        const userId = randomUUID();

        const articles = [
            randomArticle('Foo Flighters Top Black L'),
            randomArticle('Nerdwear Zipper Purple L'),
            randomArticle('Chucks Norris 41 EU'),
            randomArticle('Warstars Megaposter'),
            randomArticle('The Ring - Ring')
        ];

        const orderActor = messagebus.register({
            subscribe: {
                order: {
                    created(order) {
                        console.log("ORDER", order)
                    }
                }
            }
        })

        articles.forEach(article => messagebus.publish('user', 'articleAdded', { userId, article }));
        messagebus.publish('user', 'createOrder', { userId });
        // TODO: Include shipping
        
    });
});