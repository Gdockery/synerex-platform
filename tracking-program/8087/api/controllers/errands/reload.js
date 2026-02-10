module.exports = function (req, res) {

  return sails.reloadActions(err => {
    console.log('-- SAILS RELOADED --')
    res.end('' + (err ? err : ''))
  })

}
