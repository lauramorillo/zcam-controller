class Tracer {
  constructor() {
    this.showLog = process.env.SHOW_LOG
  }

  log(message) {
    if (this.showLog) {
      console.log(this.getDate(), '-', message)
    }
  }

  error(error) {
    console.log(this.getDate(), '-', error)
  }

  getDate() {
    return new Date().toISOString()
  }
}

module.exports = Tracer
