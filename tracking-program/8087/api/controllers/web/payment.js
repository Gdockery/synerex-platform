const { createSubscription, deleteSubscription } = require('../../services/AuthorizenetService')

const PlanPrices = sails.config.constants.SERVICE_PLAN_PRICES
const PlanNames = sails.config.constants.SERVICE_PLAN_NAMES

const COUNT_QUERY = `
  select project.id as project,
    gateways.count as gateways,
    meters.count as meters,
    switches.count as switches,
    repeaters.count as repeaters
  from project
  left join (
        select count(*) as count, project
      from gateway
      where isDeleted = 0
      group by project
    ) as gateways
    on project.id = gateways.project
  left join (
        select count(*) as count, project
      from meter
      where isDeleted = 0
      group by project
    ) as meters
    on project.id = meters.project
  left join (
        select count(*) as count, project
      from switch
      where isDeleted = 0
      group by project
    ) as switches
    on project.id = switches.project
  left join (
        select count(*) as count, project
      from repeater
      where isDeleted = 0
      group by project
    ) as repeaters
    on project.id = repeaters.project
  where project.isDeleted = 0
`


const Actions = {

  'info': function (inputs, exits) {
    let datastore = sails.getDatastore('default')

    let projects = this.req.user.projects

		let ownedProjects = projects.map(project => project.id)

    datastore.sendNativeQuery(
      COUNT_QUERY + ' AND project.id IN (' + (ownedProjects.join(',') || '"impossible id"') + ')',
      [this.req.session.userId]
    )
      .then(queryResult => {
        let results = queryResult.rows

        for (let resources of results) {
          let project = projects.find(one => one.id == resources['project'])
          if (project) {
            project.resources = resources

            for (let key of ['gateways', 'meters', 'switches', 'repeaters']) {
              if (resources[key] === null) {
                resources[key] = 0
              }
            }

            // hardcoded for now
            resources.server = 1
            resources.addlUsers = 0
            resources.support = 0

            resources.subscription = null
          }
        }

        exits.success({
          projects: projects,
          planNames: PlanNames,
          planPrices: PlanPrices
        })
      })
      .catch(err => {
        if (err) {
          return exits.error(err)
        }
      })
  },

  'delete-subscription': function (inputs, exits) {
    deleteSubscription(inputs.params.id)
      .then(() => {

        // This is a mess; what happens if the service plan object stops being populated?
        let affectedProjects = this.req.user.projects.filter(project => {
          return project.servicePlan && project.servicePlan.subscription == inputs.params.id
        })

        Promise.all(
          affectedProjects.map(project => {
            return Promise.all([
              ServicePlan.destroy(project.servicePlan.id),
              Project.update({
                id: project.id
              })
                .set({
                  servicePlan: null
                })
            ])
          })
        )
          .then(exits.success)
          .catch(exits.error)

      })
      .catch(exits.error)
  },

  'create-subscription': function (inputs, exits) {
    let projectNames = {}

    for (let project of this.req.user.projects) {
      projectNames[project.id] = project.name
    }

    createSubscription(inputs.params.plan,
      inputs.params.projectIDs.map(id => projectNames[id]),
      inputs.params.firstName, inputs.params.lastName, inputs.params.zip,
      inputs.params.amount,
      inputs.params.monthly,
      inputs.params.cardNumber, inputs.params.cardExpiry, inputs.params.cardCode,
      inputs.params.routingNumber, inputs.params.accountNumber
    )
      .then(subscriptionId => {
        ServicePlan.createEach(inputs.params.projectIDs.map((id, i) => {
          return {
            type: inputs.params.plan,
            price: inputs.params.projectPrices[i] * (inputs.params.monthly ? 1 : 11),
            subscription: subscriptionId,
            billingInterval: inputs.params.monthly ? 1 : 12,
            paymentMethod: inputs.params.cardNumber ? 'card' : 'account',
            accountNumber: 'xxxx' + (
              inputs.params.cardNumber
                ? inputs.params.cardNumber
                : inputs.params.accountNumber
            ).slice(-4)
          }
        }))
          .fetch()
          .then(plans => {
            Promise.all(
              inputs.params.projectIDs.map((id, i) => {
                return Project.update({ id: id })
                  .set({
                    servicePlan: plans[i].id
                  })
              })
            )
              .then(exits.success)
              .catch(exits.error)

          })
          .catch(exits.error)
      })
      .catch(exits.error)
  }

}


module.exports = {

  friendlyName: 'Payment test handler',

  description: 'Testing out payment with authorize.net.',


  inputs: {
    action: {
      description: 'An action name',
      example: 'some-action',
      required: true
    },

    client: {
      description: 'The client ID',
      example: 3,
      required: false
    },

    params: {
      description: 'Action parameters',
      example: {},
      required: false
    }
  },


  exits: {
    badRequest: { statusCode: 400 }
  },


  fn: function (inputs, exits) {

    if (!Actions[inputs.action]) {
      return exits.badRequest('no action')
    }

    try {
      return Actions[inputs.action].apply(this, arguments)
    } catch (err) {
      return exits.error(err)
    }

  }

}
