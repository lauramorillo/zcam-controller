const yaml = require("node-yaml")

class Config {
  static async getConfig(driveConnector) {
    if (!process.env.CAM_ID) {
      throw new Error('CAM_ID not configured')
    }
    const CAM_ID = 'cam' + process.env.CAM_ID
    const configFile = `${CAM_ID}-config.yaml`
    const file = await driveConnector.getConfigFile(configFile)
    return new Config(yaml.parse(file).config)
  }

  constructor(config) {
    this._config = Object.assign({}, config)
  }

  get folderName() {
    return CAM_ID
  }

  get startHour() {
    return this._config.startHour
  }

  get endHour() {
    return this._config.endHour
  }

  get frequency() {
    return this._config.frequency
  }

  get daysOfWeek() {
    return this._config.daysOfWeek
  }

  get rawEnabled() {
    return this._config.rawEnabled
  }

  get dailyEnabled() {
    return this._config.dailyEnabled
  }

  get updateCode() {
    return this._config.updateCode
  }

  stringify() {
    return JSON.stringify(this._config)
  }
}

module.exports = Config
