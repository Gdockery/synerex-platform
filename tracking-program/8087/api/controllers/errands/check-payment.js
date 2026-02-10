const { getSubscriptions } = require('../../services/AuthorizenetService')

module.exports = function (req, res) {
  console.log('check-payment initiated')

  getSubscriptions()
    .then(subscriptions => {
      for (let subscription of subscriptions) {
        ServicePlan.find({
          subscription: subscription.id
        })
          .then(plans => {

            if (!plans.length) {
              console.log('[WARN] Could not find matching service plans for subscription', subscription.id)
              return
            }

            let dateParts = subscription.createTimeStampUTC.split('T')
            dateParts.push('GMT')

            // start from creation date
            let expiresAt = new Date(
              dateParts.join(' ')
            )

            // add so many months that were paid for
            expiresAt.setMonth(
              expiresAt.getMonth()
              + subscription.pastOccurrences * plans[0].billingInterval
            )

            // add a grace period of 7 days
            expiresAt.setTime(
              expiresAt.getTime()
              + 1000 * 3600 * 24 * 7
            )

            if (plans[0].expiresAt < expiresAt.getTime()) {

              ServicePlan.update({
                id: {
                  in: plans.map(plan => plan.id)
                }
              })
                .set({
                  expiresAt: expiresAt.getTime()
                }).exec(err => {
                  if (err) {
                    console.log('[ERROR] Could not update the service plans in the DB:', err)
                  }
                })
            }

          })
          .catch(err => {
            console.log('[ERROR] Could not get service plans from the DB:', err)
          })
      }
    })
    .catch(err => {
      console.log('[ERROR] Could not get subscriptions from authorize.net:', err)
    })

  res.end()
}
