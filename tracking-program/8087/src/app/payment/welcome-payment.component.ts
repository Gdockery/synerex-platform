import { Component, ViewChild } from '@angular/core'
import { CurrentUserService } from "../shared/user/currentUser.service"
import { PaymentService } from './payment.service'
import { OverlayPanel, ConfirmationService } from 'primeng/primeng'
import * as isValidCard from 'card-validator'

const aWeekMs = 1000 * 3600 * 24 * 7

@Component({
  selector: 'welcome-payment',
  templateUrl: './welcome-payment.component.html'
})
export class WelcomePaymentComponent {

  @ViewChild('breakdown', {static: false}) breakdown: OverlayPanel

  private isClientAdmin = false
  private projects = []
  private planNames = {}
  private planPrices = {}
  private subscriptions = []
  private selectedProjects = []
  private dataReady = false
  private blocked = true
  private breakdownId = null
  private selectedOption = 'lan'
  private subscriptionTotal = 0
  private countableTypes = ['server', 'gateways', 'meters', 'switches', 'repeaters', 'addlUsers', 'support']
  private paymentVisible = false
  private name
  private cardNumber
  private cardExpiry
  private cardCode
  private zip
  private accountRouting
  private accountNumber
  private paymentInterval = 'monthly'
  private paymentMethod = 'card'
  private paymentAgree = []
  private cardValidity = {
    number: { isValid: false },
    date: { isValid: false, month: null, year: null },
    code: { isValid: false }
  }
  private nameValidity = {
    isValid: false,
    firstName: null,
    lastName: null
  }
  private zipValidity = {
    isValid: false
  }
  private accountValidity = {
    routing: { isValid: false },
    number: { isValid: false }
  }
  private isPaymentValid = false


  private items = [
    {
      type: 'server',
      icon: 'desktop',
      title: 'Optional Server',
    },
    {
      type: 'gateways',
      icon: 'wifi',
      title: 'Synerex Gateway',
    },
    {
      type: 'meters',
      icon: 'barchart',
      title: 'Synerex Meter',
    },
    {
      type: 'switches',
      icon: 'toggles',
      title: 'Synerex Switches',
    },
    {
      type: 'repeaters',
      icon: 'target',
      title: 'Synerex Repeater',
    },
    {
      type: 'upgrades',
      icon: 'sync',
      title: 'Software Upgrades',
    },
    {
      type: 'maintenance',
      icon: 'settings',
      title: 'Maintenance',
    },
    {
      type: 'users',
      icon: 'user',
      title: 'Users',
    },
    {
      type: 'addlUsers',
      icon: 'users',
      title: 'Add\'l Users',
    },
    {
      type: 'support',
      icon: 'phone',
      title: 'Tech Support (per hour)',
    }
  ]


  constructor(
    private currentUserService: CurrentUserService,
    private paymentService: PaymentService,
    private confirmationService: ConfirmationService
  ) { }


  ngOnInit() {
    this.isClientAdmin = this.currentUserService.user.role === 2
    this.currentUserService.deselectProject()
    this.refreshData()
  }

  refreshData() {
    this.blocked = true

    this.paymentService.getInfo().subscribe(info => {
      this.planNames = info.planNames
      this.planPrices = info.planPrices
      this.projects = info.projects

      let subs = {}
      for (let project of this.projects) {
        let plan = project.servicePlan
        if(!plan) {
          continue
        }

        let subId = plan.subscription
        if (!subs[subId]) {
          subs[subId] = {
            id: subId,
            createdAt: plan.createdAt,
            expiresAt: plan.expiresAt,
            amount: plan.price,
            monthly: plan.billingInterval == 1,
            method: plan.paymentMethod,
            account: plan.accountNumber,
            projects: [project.id]
          }
        } else {
          subs[subId].amount += plan.price
          subs[subId].projects.push(project.id)
        }
      }
      this.subscriptions = this.values(subs)

      this.dataReady = true
      this.blocked = false
    })
  }

  getProject(id) {
    return this.projects.find(p => p.id == id)
  }

  prettyDay(date) {
    let suffix = 'th'

    let d = date.getDate()

    switch (d % 10) {
      case 1:
        suffix = 'st'
        break
      case 2:
        suffix = 'nd'
        break
      case 3:
        suffix = 'rd'
        break
    }

    if (d > 10 && d < 14) {
      suffix = 'th'
    }

    return d + suffix

  }

  shortMonth(date) {
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[date.getMonth()]
  }

  billingDay(subscription) {
    let createdAt = (new Date(subscription.createdAt))

    return (subscription.monthly ? '' : this.shortMonth(createdAt) + ' ') + this.prettyDay(createdAt)
  }

  expireDate(subscription) {
    let date = new Date(subscription.expiresAt)
    return this.shortMonth(date) + ' ' + this.prettyDay(date) + ', ' + date.getFullYear()
  }

  expiresSoon(subscription) {
    return subscription.expiresAt - (new Date).getTime() < aWeekMs
  }

  values(dictionary) {
    let list = []
    for (let key in dictionary) {
      list.push(dictionary[key])
    }

    return list
  }

  pending() {
    return (
      this.values(this.projects)
        .filter(project => !project.servicePlan)
        .sort((a, b) => {
          return a.name < b.name ? -1 : 1
        })
    )
  }

  options() {
    let opts = []
    for (let key in this.planNames) {
      opts.push({
        label: this.planNames[key],
        value: key
      })
    }

    return opts
  }

  price(itemType, id = null) {
    let price = this.planPrices[this.selectedOption]

    if (!id) {
      if (typeof price[itemType] == 'number'
        && this.countableTypes.indexOf(itemType) > -1
      ) {
        return '$' + this.format(price[itemType])
      }

      return ''
    }

    if (typeof price[itemType] == 'number') {
      return '$' + this.format(price[itemType] * this.getProject(id).resources[itemType])
    } else {
      return price[itemType]
    }
  }

  format(price) {
    return (Math.ceil(price * 100)) / 100
  }

  total(id) {
    let price = this.planPrices[this.selectedOption]
    let itemCount = this.getProject(id).resources
    let total = 0

    for (let item of this.items) {
      if (typeof price[item.type] == 'number') {
        total += price[item.type] * itemCount[item.type]
      }
    }

    return this.format(total)
  }

  updateTotal() {
    let gtotal = 0
    for (let id of this.selectedProjects) {
      gtotal += this.total(id)
    }

    this.subscriptionTotal = gtotal
  }

  cancel(subscription) {
    let projects = subscription.projects.map(id => this.getProject(id).name).join('", "')
    this.confirmationService.confirm({
      message: 'Are you sure you want to cancel service<br>for "' + projects + '"?',
      accept: () => {
        this.blocked = true
        this.paymentService.deleteSubscription(subscription.id)
          .subscribe(res => {
            this.refreshData()
          }, err => {
            this.blocked = false
          })
      }
    })
  }

  checkout() {
    this.paymentVisible = true
  }

  create() {
    let monthly = this.paymentInterval == 'monthly'

    let params: any = {
      plan: this.selectedOption,
      projectIDs: this.selectedProjects,
      projectPrices: this.selectedProjects.map(id => this.total(id)),
      firstName: this.nameValidity.firstName,
      lastName: this.nameValidity.lastName,
      zip: this.zip,
      amount: this.subscriptionTotal * (monthly ? 1 : 11),
      monthly: monthly
    }

    if (this.paymentMethod == 'card') {
      let year = this.cardValidity.date.year
      if (year.length == 2) {
        year = '20' + year
      }

      params.cardNumber = (this.cardNumber || '').split('-').join('')
      params.cardExpiry = year + '-' + this.cardValidity.date.month
      params.cardCode = this.cardCode
    } else {
      params.routingNumber = this.accountRouting
      params.accountNumber = this.accountNumber
    }

    this.paymentVisible = false
    this.blocked = true

    this.paymentService.createSubscription(params)
      .subscribe(res => {
        this.selectedProjects = []
        this.updateTotal()
        this.refreshData()
      }, err => {
        this.blocked = false
      })
  }

  expMonths() {
    return (
      ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
        .map(month => {
          return {
            label: month,
            value: month
          }
        })
    )
  }

  expYears() {
    let start = (new Date).getFullYear(), years = []
    for (let i = 0; i < 10; i++) {
      years.push({
        label: start + i,
        value: start + i
      })
    }

    return years
  }

  onCardInput(type) {
    switch (type) {
      case 'number':
        this.cardValidity[type] = isValidCard.number(this.cardNumber)
        break
      case 'date':
        this.cardValidity[type] = isValidCard.expirationDate(this.cardExpiry)
        break
      case 'code':
        this.cardValidity[type] = isValidCard.cvv(this.cardCode)
        break
    }

    this.updatePaymentValidity()
  }

  onNameInput() {
    let name = this.name.replace(/(^\s+|\s+$)/g, '')
    let names = name.split(' ')

    this.nameValidity = {
      isValid: name.length > 4 && names.length > 1,
      firstName: names[0],
      lastName: names[1]
    }

    this.updatePaymentValidity()
  }

  onZipInput() {
    this.zipValidity = isValidCard.postalCode(this.zip)

    this.updatePaymentValidity()
  }

  onAccountInput(type) {
    switch (type) {
      case 'routing':
        this.accountValidity.routing.isValid = this.isValidRouting(this.accountRouting)
        break
      case 'number':
        let chars = this.accountNumber.length
        this.accountValidity.number.isValid = 16 <= chars && chars <= 34
        break
    }

    this.updatePaymentValidity()
  }

  isValidRouting(t) {
    if (t.length != 9) {
      return false
    }

    let n = 0;
    for (let i = 0; i < t.length; i += 3) {
      n += parseInt(t.charAt(i), 10) * 3
        + parseInt(t.charAt(i + 1), 10) * 7
        + parseInt(t.charAt(i + 2), 10)
    }

    if (n != 0 && n % 10 == 0) {
      return true
    } else {
      return false
    }
  }

  updatePaymentValidity() {
    this.isPaymentValid = true

    if (this.paymentAgree.length < 1
      || !this.nameValidity.isValid
      || !this.zipValidity.isValid
    ) {
      this.isPaymentValid = false
      return
    }

    if (this.paymentMethod == 'card') {

      this.isPaymentValid = (
        this.cardValidity.number.isValid
        && this.cardValidity.date.isValid
        && this.cardValidity.code.isValid
      )

    } else {

      this.isPaymentValid = (
        this.accountValidity.routing.isValid
        && this.accountValidity.number.isValid
      )

    }
  }


}
