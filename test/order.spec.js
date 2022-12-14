const Messagebus = require('../src/messagebus');
const UserActor = require('../src/actors/user.actor');
const { randomUUID } = require("crypto");
const statemachine = require('../src/statemachine');
const { assert } = require('console');

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
        assert(actor.user.state.get('user-1.shoppingCart'));
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

        const orderStateMachine = (order) => {
            const orderState = Object.assign({}, order);
            const upsert = (key, value) => {
                if (orderState.value) return orderState;
                return Object.assign(orderState, { [key]:value });
            }
            const machine = statemachine({
                initial: {
                    entry() {
                        Object.assign(orderState, order, {
                            created: new Date()
                        });
                        if (orderState.cancelled) return this.enter('cancelled');
                        if (orderState.completed) return this.enter('completed');
                        if (orderState.shipped) return this.enter('shipped');
                        if (orderState.paid) return this.enter('paid');

                        this.emit('orderCreated', orderState);
                    },
                    cancel() {
                        this.enter('cancelled');
                    },
                    pay() {
                        this.enter('paid');
                    }
                },
                cancelled: {
                    entry() {
                        upsert('cancelled', new Date());
                        this.emit('orderCancelled', orderState);
                    }
                },
                paid: {
                    entry() {
                        upsert('paid', new Date());
                        this.emit('orderUpdated', orderState);
                    },
                    ship() {
                        this.enter('shipped', orderState);
                    }
                },
                shipped: {
                    entry() {
                        upsert('shipped', new Date());
                        this.emit('orderUpdated', orderState);
                    },
                    received() {
                        this.enter('completed', orderState)
                    }
                },
                completed: {
                    entry() {
                        upsert('completed', new Date());
                        this.emit('orderUpdated', orderState);
                    }
                }
            });
            return machine;
        }

        const orderActor = messagebus.register({
            subscribe: {
                order: {
                    created(order) {
                        const orderId = `order-${order.id}`;
                        const orderMachine = orderStateMachine(order);
                        orderMachine.addListener('orderCancelled', order => {
                            console.log("ORDER CANCELLED", order)
                        })
                        orderMachine.addListener('orderCreated', order => {
                            console.log("ORDER CREATED", order)
                        })
                        orderMachine.addListener('orderUpdated', order => {
                            console.log("UPDATE", order)
                        })
                        orderMachine.reset();
                        this.setProperty(orderId, orderMachine);

                    },
                    payed(orderId) {
                        const orderPropertyId = `order-${orderId}`;
                        const orderState = this.getProperty(orderPropertyId);
                        orderState.send('pay');
                    },
                    cancel(orderId) {
                        const orderPropertyId = `order-${orderId}`;
                        const orderState = this.getProperty(orderPropertyId);
                        orderState.send('cancel');
                    }
                }
            }
        });

        const orderId = randomUUID();
        articles.forEach(article => messagebus.publish('user', 'articleAdded', { userId, article }));
        messagebus.publish('user', 'createOrder', { userId, orderId });
        messagebus.publish('order', 'payed', orderId);
//        console.log(orderActor)
        // TODO: Include shipping
        
    });
});