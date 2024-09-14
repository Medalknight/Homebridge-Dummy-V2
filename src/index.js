const { API, DynamicPlatformPlugin, PlatformAccessory, Service, Characteristic } = require('homebridge');

const PLUGIN_NAME = 'homebridge-dummy-v2';
const PLATFORM_NAME = 'HomebridgeDummySwitchPlatform';

let switchOnTimeout;
let delayTimeout;

module.exports = (api) => {
  api.registerPlatform(PLATFORM_NAME, HomebridgeDummySwitchPlatform);
};

class HomebridgeDummySwitchPlatform extends DynamicPlatformPlugin {
  constructor(log, config, api) {
    super(log, config, api);
    this.log = log;
    this.config = config;
    this.api = api;

    this.accessories = [];

    this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
  }

  didFinishLaunching() {
    const name = this.config.name || 'Dummy Switch';
    const delayTime = this.config.delayTime || 10;

    this.log.info('Configuring Dummy Switch with delay time of', delayTime, 'seconds.');

    const uuid = this.api.hap.uuid.generate(name);
    const accessory = new this.api.platformAccessory(name, uuid);
    const service = accessory.addService(this.api.hap.Service.Switch, name);

    // Switch State
    service.getCharacteristic(this.api.hap.Characteristic.On)
      .onGet(this.handleOnGet.bind(this))
      .onSet(this.handleOnSet.bind(this));

    this.accessories.push(accessory);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

    // Start the repeating cycle
    this.startRepeatingCycle(service, delayTime);
  }

  startRepeatingCycle(service, delayTime) {
    const delayMs = delayTime * 1000; // Convert delay time from seconds to milliseconds
    this.log.info(`Starting the automatic cycle with a ${delayTime} second delay.`);

    // Start delay for turning on the switch
    delayTimeout = setTimeout(() => {
      service.updateCharacteristic(this.api.hap.Characteristic.On, true);
      this.log.info('Switch turned ON.');

      // After 5 seconds, turn the switch OFF again
      switchOnTimeout = setTimeout(() => {
        service.updateCharacteristic(this.api.hap.Characteristic.On, false);
        this.log.info('Switch turned OFF.');

        // Start the cycle again
        this.startRepeatingCycle(service, delayTime);
      }, 5000); // Switch turns off after 5 seconds
    }, delayMs);
  }

  handleOnGet() {
    this.log.info('Getting current switch state...');
    return false; // Default is OFF
  }

  handleOnSet(value) {
    this.log.info('Setting switch state to', value);
  }
}
