class Tracer {
  constructor() {
    this.showLog = true // process.env.SHOW_LOG
  }

  log(message) {
    if (this.showLog) {
      console.log(message)
    }
  }

  error(error) {
    console.log(error)
  }
}

module.exports = Tracer
