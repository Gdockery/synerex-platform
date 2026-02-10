const { readFileSync } = require('fs')

module.exports = (req, res, next) => {
  try {
    let key = JSON.parse(MaintenanceService.decrypt(req.body.key).toString())

    if (
      key.secret == readFileSync(require('os').homedir() + '/.xeco-maintenance').toString()
      && key.salt
    ) {
      return next()
    }

  } catch(e) {
    console.log(e)
  }

  return res.forbidden()
}