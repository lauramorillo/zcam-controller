const Tracer = require('../Tracer')
const CamConnector = require('../CamConnector')

const tracer = new Tracer()
const camConnector = new CamConnector(tracer)

class CamController {
  static executeCommand(req, res, next) {
    const path = req.path.substring(4, req.path.length)
    camConnector.executeCommand(path, req.query).then(result => {
      res.json(result)
    }).catch(err => {
      res.json(error)
    })
  }

  static start(req, res, next) {
    camConnector.start()
    res.json()
  }
}

module.exports = CamController
