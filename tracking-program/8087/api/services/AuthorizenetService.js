const { APIContracts, APIControllers, Constants } = require('authorizenet')

const PlanNames = sails.config.constants.SERVICE_PLAN_NAMES

const Env = 'production'

module.exports = {
  createSubscription: createSubscription,
  getSubscriptions: getSubscriptions,
  getSubscription: getSubscription,
  deleteSubscription: deleteSubscription
}


function createSubscription(plan, projectNames,
  firstName, lastName, zip, amount, monthly,
  cardNumber, cardExpiry, cardCode, routingNumber, accountNumber
) {
  return new Promise((resolve, reject) => {
    let request = new APIContracts.ARBCreateSubscriptionRequest()
    request.setMerchantAuthentication(getAuth())
    request.setSubscription(getSubscriptionFor({
      amount: amount,
      monthly: monthly,
      cardExpiry: cardExpiry,
      cardNumber: cardNumber,
      cardCode: cardCode,
      routingNumber: routingNumber,
      accountNumber: accountNumber,
      description: 'This subscription was activated for plan '
        + PlanNames[plan] + ' for projects: ' + projectNames.join(', '),
      invoiceIdString: '',
      isAnnual: false,
      iterations: monthly ? 120 : 10,
      subscriptionName: '(' + plan + ') ' + projectNames.join(', '),
      xecoCustomerId: '',
      firstName: firstName,
      lastName: lastName,
      zip: zip
    }))

    //console.log("cardExpiry: " + request.cardExpiry);
    //console.log("Sub name: " + request.subscriptionName);
    //console.log("FL name: " + request.firstName + " " + request.lastName);

    execute(request, response => {
      console.log('AUTH.NET: executing subscription request');
      if (!response) {
        console.log('AUTH.NET: null response');
        return reject('CREATE SUBSCRIPTION > NULL RESPONSE')
      }

      if (response.getMessages().getResultCode() != APIContracts.MessageTypeEnum.OK) {
        console.log('AUTH.NET: error: ' + response.getMessages().getMessage()[0].getText());
        return reject(response.getMessages().getMessage()[0].getText())
      }

      console.log('AUTH.NET: success, subID: ' + response.getSubscriptionId());
      resolve(response.getSubscriptionId())
    })
  })
}

function getSubscriptions() {
  return new Promise((resolve, reject) => {
    console.log('AUTH.NET: listing subs');
    let request = new APIContracts.ARBGetSubscriptionListRequest()
    request.setMerchantAuthentication(getAuth())
    request.setSearchType(APIContracts.ARBGetSubscriptionListSearchTypeEnum.SUBSCRIPTIONACTIVE)
    request.setSorting(getSubscriptionSorting())
    request.setPaging(getPaging(1000))

    execute(request, response => {
      if (!response) {
        console.log('AUTH.NET: null response');
        return reject('GET SUBSCRIPTIONS > NULL RESPONSE')
      }

      if (response.getMessages().getResultCode() != APIContracts.MessageTypeEnum.OK) {
        console.log('AUTH.NET: error: ' + response.getMessages().getMessage()[0].getText());
        return reject(response.getMessages().getMessage()[0].getText())
      }

      console.log('AUTH.NET: success');
      resolve(response.getSubscriptionDetails().getSubscriptionDetail())
    })
  })
}

function getSubscription(id) {
  return new Promise((resolve, reject) => {
    console.log('AUTH.NET: getting sub: ' + id);
    let request = new APIContracts.ARBGetSubscriptionRequest()
    request.setMerchantAuthentication(getAuth())
    request.setSubscriptionId(id)

    execute(request, response => {
      if (!response) {
        console.log('AUTH.NET: null response');
        return reject('GET SUBSCRIPTION > NULL RESPONSE')
      }

      if (response.getMessages().getResultCode() != APIContracts.MessageTypeEnum.OK) {
        console.log('AUTH.NET: error: ' + response.getMessages().getMessage()[0].getText());
        return reject(response.getMessages().getMessage()[0].getText())
      }

      console.log('AUTH.NET: success');
      resolve(response.getSubscription())
    })
  })
}

function deleteSubscription(id) {
  return new Promise((resolve, reject) => {
    console.log('AUTH.NET: deleting sub: ' + id);
    let request = new APIContracts.ARBCancelSubscriptionRequest()
    request.setMerchantAuthentication(getAuth())
    request.setSubscriptionId(id)

    execute(request, response => {
      if (!response) {
        console.log('AUTH.NET: null response');
        return reject('DELETE SUBSCRIPTION > NULL RESPONSE')
      }

      if (response.getMessages().getResultCode() != APIContracts.MessageTypeEnum.OK) {
        console.log('AUTH.NET: error: ' + response.getMessages().getMessage()[0].getText());
        return reject(response.getMessages().getMessage()[0].getText())
      }

      console.log('AUTH.NET: success');
      resolve(response)
    })
  })

}

function getFormToken(amount) {
  return new Promise((resolve, reject) => {
    console.log('AUTH.NET: getFormToken');
    let transaction = getTransaction(amount)

    let request = new APIContracts.GetHostedPaymentPageRequest()
    request.setMerchantAuthentication(getAuth())
    request.setTransactionRequest(transaction)
    request.setHostedPaymentSettings(getSettingList({
      hostedPaymentButtonOptions: {
        text: "Pay now"
      },
      hostedPaymentOrderOptions: {
        show: false
      }
    }))

    console.log('AUTH.NET: executing');
    execute(request, resolve)
  })
}

function getProfilePage(profileId, returnURL) {
  return new Promise((resolve, reject) => {
    console.log('AUTH.NET: getProfilePage');
    let request = new APIContracts.GetHostedProfilePageRequest()
    request.setMerchantAuthentication(getAuth())
    request.setCustomerProfileId(profileId)
    request.setHostedProfileSettings(getSettingList({
      hostedProfileReturnUrl: returnURL
    }))

    console.log('AUTH.NET: executing');
    execute(request, resolve)
  })
}

function getProfileIDs() {
  return new Promise((resolve, reject) => {
    console.log('AUTH.NET: getProfileIds');
    let request = new APIContracts.GetCustomerProfileIdsRequest()
    request.setMerchantAuthentication(getAuth())

    console.log('AUTH.NET: executing');
    execute(request, response => {
      let ids = response.getIds()
      resolve(
        ids
          ? ids.getNumericString()
            .map(item => item.toString())
          : []
      )
    })
  })
}


// ----------------------------------------------------------------
// --
// -- INTERNAL
// --
// ----------------------------------------------------------------

const Config = {
  production: {
    name: '8xDxh5nY3e',
    key: '888vwK8rFD3ap8Tz'
  },
  development: {
    name: '3NsN7Kw9Wsk',
    key: '382Qp3vJT8x8Xq6W'
  }
}

function execute(request, callback) {
  let requestName = request.constructor.name
  let controllerName = requestName.replace(/Request$/, 'Controller')
  let responseName = requestName.replace(/Request$/, 'Response')

  console.log('AUTH.NET: ENV = ' + Env);
  let ctrl = new APIControllers[controllerName](request.getJSON())
  ctrl.setEnvironment(
    Env == 'production'
      ? Constants.endpoint.production
      : Constants.endpoint.sandbox
  )
  ctrl.execute(() => {
    let apiResponse = ctrl.getResponse()

    let response = new APIContracts[responseName](apiResponse)

    callback(response)
  })
}

function getAuth() {
  let auth = new APIContracts.MerchantAuthenticationType()

  auth.setName(Config[Env].name)
  auth.setTransactionKey(Config[Env].key)

  return auth
}

function getTransaction(amount) {
  let request = new APIContracts.TransactionRequestType()
  request.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION)
  request.setAmount(amount)

  return request
}

function getSetting(name, value) {
  let setting = new APIContracts.SettingType()
  setting.setSettingName(name)
  setting.setSettingValue(
    typeof value == 'string'
      ? value
      : JSON.stringify(value)
  )

  return setting
}

function getSettingList(settingsObject) {
  let temp = []
  for (let name in settingsObject) {
    temp.push(getSetting(name, settingsObject[name]))
  }

  let list = new APIContracts.ArrayOfSetting()
  list.setSetting(temp)

  return list
}

function getSubscriptionSorting() {
  let sorting = new APIContracts.ARBGetSubscriptionListSorting()
  sorting.setOrderDescending(true)
  sorting.setOrderBy(APIContracts.ARBGetSubscriptionListOrderFieldEnum.CREATETIMESTAMPUTC)

  return sorting
}

function getPaging(pageSize, pageNumber) {
  if (!pageNumber) {
    pageNumber = 1
  }

  if (!pageSize) {
    pageSize = 100
  }

  let paging = new APIContracts.Paging()
  paging.setOffset(pageNumber)
  paging.setLimit(pageSize)

  return paging
}

function getSubscriptionFor({
  subscriptionName, iterations, amount, monthly,
  cardExpiry, cardNumber, cardCode,
  routingNumber, accountNumber,
  firstName, lastName, zip,
  invoiceIdString, description, xecoCustomerId }
) {
  let subscription = new APIContracts.ARBSubscriptionType()
  subscription.setName(subscriptionName)

  let schedule = new APIContracts.PaymentScheduleType()
  let interval = new APIContracts.PaymentScheduleType.Interval()
  interval.setLength(monthly ? 1 : 12)
  interval.setUnit(APIContracts.ARBSubscriptionUnitEnum.MONTHS)
  schedule.setInterval(interval)
  schedule.setStartDate((new Date).toISOString().split('T')[0])
  schedule.setTotalOccurrences(iterations)
  subscription.setPaymentSchedule(schedule)

  subscription.setAmount(amount)

  let payment = new APIContracts.PaymentType()
  if (cardNumber) {
    let creditCard = new APIContracts.CreditCardType()
    creditCard.setExpirationDate(cardExpiry)
    creditCard.setCardNumber(cardNumber)
    creditCard.setCardCode(cardCode)
    payment.setCreditCard(creditCard)
  } else {
    let bankAccount = new APIContracts.BankAccountType()
    bankAccount.setRoutingNumber(routingNumber)
    bankAccount.setAccountNumber(accountNumber)
    bankAccount.setNameOnAccount(firstName + ' ' + lastName)
    payment.setBankAccount(bankAccount)
  }
  subscription.setPayment(payment)

  let order = new APIContracts.OrderType()
  order.setInvoiceNumber(invoiceIdString)
  order.setDescription(description)
  subscription.setOrder(order)

  let customer = new APIContracts.CustomerType()
  customer.setType(APIContracts.CustomerTypeEnum.BUSINESS)
  customer.setId(xecoCustomerId)
  subscription.setCustomer(customer)

  let name = new APIContracts.NameAndAddressType()
  name.setFirstName(firstName)
  name.setLastName(lastName)
  name.setZip(zip)
  subscription.setBillTo(name)

  return subscription
}
