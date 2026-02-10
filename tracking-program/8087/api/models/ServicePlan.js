/**
 * ServicePlan.js
 *
 * @description :: A service plan record exists once a user succesfully registers a payment method with authorize.net
 */

module.exports = {

    attributes: {

        type: {
            type: 'string',
            isIn: values(sails.config.constants.SERVICE_PLAN_TYPES),
            required: true
        },

        price: {
            type: 'number',
            columnType: 'DOUBLE',
            required: true
        },

        subscription: {
            // this ID comes from authorize.net
            type: 'number',
            columnType: 'INT',
            required: true
        },

        billingInterval: {
            type: 'number',
            columnType: 'INT',
            required: true
        },

        paymentMethod: {
            type: 'string',
            required: true
        },

        accountNumber: {
            type: 'string',
            required: true
        },

        expiresAt: {
            type: 'number',
            columnType: 'BIGINT',
            defaultsTo: 0
        }
    },

    beforeCreate: function (values, proceed) {
        if (!values.expiresAt && values.subscription) {
            values.expiresAt = (new Date).getTime() + 1000 * 3600 * 24 * 7
        }

        return proceed()
    }

}

function values(O) {
    let values = []
    for(let key in O) values.push(O[key])

    return values
}