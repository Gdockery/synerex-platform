"""
Authorize.net service - ported from api/services/AuthorizenetService.js
Handles create/delete subscription for payment. Requires AUTHORIZENET_API_LOGIN and
AUTHORIZENET_TRANSACTION_KEY when enabled.
"""


def create_subscription(
    plan,
    project_names,
    first_name,
    last_name,
    zip_code,
    amount,
    monthly,
    card_number=None,
    card_expiry=None,
    card_code=None,
    routing_number=None,
    account_number=None,
):
    """Create ARB subscription. Returns subscription_id or raises."""
    try:
        from authorizenet import apicontractsv1
        from authorizenet.apicontrollers import ARBCreateSubscriptionController
    except ImportError:
        raise RuntimeError("authorizenet package not installed")

    # Use config from Flask app context
    from flask import current_app
    login_id = current_app.config.get("AUTHORIZENET_API_LOGIN")
    trans_key = current_app.config.get("AUTHORIZENET_TRANSACTION_KEY")
    if not login_id or not trans_key:
        raise RuntimeError("Authorize.net not configured")

    merchant_auth = apicontractsv1.merchantAuthenticationType()
    merchant_auth.name = login_id
    merchant_auth.transactionKey = trans_key

    schedule = apicontractsv1.paymentScheduleType()
    schedule.interval = apicontractsv1.paymentScheduleTypeInterval()
    schedule.interval.length = 1 if monthly else 12
    schedule.interval.unit = apicontractsv1.ARBSubscriptionUnitEnum.months
    from datetime import date
    schedule.startDate = date.today()
    schedule.totalOccurrences = 120 if monthly else 10

    payment = apicontractsv1.paymentType()
    if card_number:
        cc = apicontractsv1.creditCardType()
        cc.cardNumber = card_number
        cc.expirationDate = card_expiry or ""
        cc.cardCode = card_code or ""
        payment.creditCard = cc
    else:
        bank = apicontractsv1.bankAccountType()
        bank.routingNumber = routing_number or ""
        bank.accountNumber = account_number or ""
        bank.nameOnAccount = f"{first_name} {last_name}"
        payment.bankAccount = bank

    bill_to = apicontractsv1.nameAndAddressType()
    bill_to.firstName = first_name
    bill_to.lastName = last_name
    bill_to.zip = zip_code or ""

    plan_names = current_app.config.get("SERVICE_PLAN_NAMES", {})
    plan_name = plan_names.get(plan, plan)
    description = f"This subscription was activated for plan {plan_name} for projects: {', '.join(project_names)}"

    order = apicontractsv1.orderType()
    order.description = description

    subscription = apicontractsv1.ARBSubscriptionType()
    subscription.name = f"({plan}) " + ", ".join(project_names)
    subscription.paymentSchedule = schedule
    subscription.amount = float(amount)
    subscription.billTo = bill_to
    subscription.payment = payment
    subscription.order = order

    request = apicontractsv1.ARBCreateSubscriptionRequest()
    request.merchantAuthentication = merchant_auth
    request.subscription = subscription

    controller = ARBCreateSubscriptionController(request)
    try:
        from authorizenet.constants import constants
        controller.setenvironment(
            constants.PRODUCTION if current_app.config.get("AUTHORIZENET_ENV") == "production"
            else constants.SANDBOX
        )
    except Exception:
        pass
    controller.execute()
    response = controller.getresponse()

    if response.messages.resultCode != apicontractsv1.messageTypeEnum.Ok:
        msg = response.messages.message[0].text if response.messages.message else "Unknown error"
        raise RuntimeError(str(msg))
    return response.subscriptionId


def get_subscriptions():
    """List active ARB subscriptions. Returns list of subscription details."""
    try:
        from authorizenet import apicontractsv1
        from authorizenet.apicontrollers import ARBGetSubscriptionListController
    except ImportError:
        raise RuntimeError("authorizenet package not installed")

    from flask import current_app
    login_id = current_app.config.get("AUTHORIZENET_API_LOGIN")
    trans_key = current_app.config.get("AUTHORIZENET_TRANSACTION_KEY")
    if not login_id or not trans_key:
        raise RuntimeError("Authorize.net not configured")

    merchant_auth = apicontractsv1.merchantAuthenticationType()
    merchant_auth.name = login_id
    merchant_auth.transactionKey = trans_key

    request = apicontractsv1.ARBGetSubscriptionListRequest()
    request.merchantAuthentication = merchant_auth
    request.searchType = apicontractsv1.ARBGetSubscriptionListSearchTypeEnum.subscriptionActive
    request.sorting = apicontractsv1.ARBGetSubscriptionListSorting()
    request.sorting.orderBy = apicontractsv1.ARBGetSubscriptionListOrderFieldEnum.createTimeStampUTC
    request.sorting.orderDescending = True
    request.paging = apicontractsv1.Paging()
    request.paging.offset = 1
    request.paging.limit = 1000

    controller = ARBGetSubscriptionListController(request)
    try:
        from authorizenet.constants import constants
        controller.setenvironment(
            constants.PRODUCTION if current_app.config.get("AUTHORIZENET_ENV") == "production"
            else constants.SANDBOX
        )
    except Exception:
        pass
    controller.execute()
    response = controller.getresponse()

    if response.messages.resultCode != apicontractsv1.messageTypeEnum.Ok:
        msg = response.messages.message[0].text if response.messages.message else "Unknown error"
        raise RuntimeError(str(msg))

    details = getattr(response, "subscriptionDetails", None) or []
    subs = getattr(details, "subscriptionDetail", None) if details else None
    if subs is None:
        return []
    return list(subs) if hasattr(subs, "__iter__") else [subs]


def delete_subscription(subscription_id):
    """Cancel ARB subscription."""
    try:
        from authorizenet import apicontractsv1
        from authorizenet.apicontrollers import ARBCancelSubscriptionController
    except ImportError:
        raise RuntimeError("authorizenet package not installed")

    from flask import current_app
    login_id = current_app.config.get("AUTHORIZENET_API_LOGIN")
    trans_key = current_app.config.get("AUTHORIZENET_TRANSACTION_KEY")
    if not login_id or not trans_key:
        raise RuntimeError("Authorize.net not configured")

    merchant_auth = apicontractsv1.merchantAuthenticationType()
    merchant_auth.name = login_id
    merchant_auth.transactionKey = trans_key

    request = apicontractsv1.ARBCancelSubscriptionRequest()
    request.merchantAuthentication = merchant_auth
    request.subscriptionId = subscription_id

    controller = ARBCancelSubscriptionController(request)
    try:
        from authorizenet.constants import constants
        controller.setenvironment(
            constants.PRODUCTION if current_app.config.get("AUTHORIZENET_ENV") == "production"
            else constants.SANDBOX
        )
    except Exception:
        pass
    controller.execute()
    response = controller.getresponse()

    if response.messages.resultCode != apicontractsv1.messageTypeEnum.Ok:
        msg = response.messages.message[0].text if response.messages.message else "Unknown error"
        raise RuntimeError(str(msg))
