const { createMachine, assign } = require('xstate');
const Store = require('../store/store');

const OrderStates = {
    new: 'init',
    cancelled: 'cancelled',
    paid: 'paid',
    pending: 'pending',
    shipped: 'shipped',
    delivered: 'delivered',
    completed: 'completed',
    refund: 'refund'
};

const OrderCommands = {
    confirm: 'confirm',
    cancel: 'cancel',
    paymentSent: 'paymentSent',
    ship: 'ship',
    confirmDelivery: 'confirmDelivery',
    retour: 'retour',
    refundSent: 'refundSent',
    retourReceived: 'retourReceived'
}

/**
 * TODO: Feed with event stream
 * @param {Store} orderStore 
 */
const Order = (orderStore) => {
    const machine = createMachine({
        context: {
            refund: {
                isRetourReceived: false,
                isMoneySentBack: false
            }
        },
        id: 'order-state-machine',
        initial: OrderStates.new,
        states: {
            [OrderStates.new]: {
                on: {
                    [OrderCommands.confirm]: {
                        target: OrderStates.pending
                    },
                    [OrderCommands.cancel]: {
                        target: OrderStates.cancelled
                    }
                }
            },
            [OrderStates.pending]: {
                on: {
                    [OrderCommands.cancel]: {
                        target: OrderStates.cancelled
                    },
                    [OrderCommands.paymentSent]: {
                        target: OrderStates.paid
                    }
                }
            },
            [OrderStates.paid]: {
                on: {
                    [OrderCommands.ship]: {
                        target: OrderStates.shipped
                    }
                }
            },
            [OrderStates.shipped]: {
                on: {
                    [OrderCommands.confirmDelivery]: {
                        target: OrderStates.delivered
                    },
                    [OrderCommands.retour]: {
                        target: OrderStates.refund
                    }
                }
            },
            [OrderStates.refund]: {
                on: {
                    [OrderCommands.retourReceived]: {
                        actions: [
                            assign({
                                retour: (context, payload) => {
                                    return {
                                        ...context.retour,
                                        isRetourReceived: true
                                    }
                                }
                            }),
                            { cond: 'isRefundComplete', target: OrderStates.cancelled }
                        ]
                    },
                    [OrderCommands.refundSent]: {
                        actions: [
                            assign({
                                retour: (context, payload) => {
                                    return {
                                        ...context.retour,
                                        isMoneySentBack: true
                                    }
                                }
                            }),
                            { cond: 'isRefundComplete', target: OrderStates.cancelled }
                        ]
                    }
                }
            },
            [OrderStates.delivered]: {},
            [OrderStates.cancelled]: {
                type: 'final'
            }
        },
    }, {
        guards: {
            isRefundComplete(context) {
                return context.refund && context.refund.isMoneySentBack && context.refund.isRetourReceived;
            }
        }
    });
}

module.exports = {
    Order,
    OrderCommands,
    OrderStates
};
