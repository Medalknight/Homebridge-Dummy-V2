import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic
} from 'homebridge';

const PLUGIN_NAME = 'homebridge-dummy-switch';
const PLATFORM_NAME = 'HomebridgeDummySwitchPlatform';

let switchOnTimeout: NodeJS.Timeout;
let delayTimeout: NodeJS.Timeout;

export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, HomebridgeDummySwitchPlatform);
};

class HomebridgeDummySwitchPlatform implements DynamicPlatformPlugin {
  private readonly log: Logger;
  private readonly config: PlatformConfig;
  private readonly api: API;

  private readonly accessories: PlatformAccessory[] = [];

  constructor(log: Logger, config: PlatformConfig, api: API) {
    this.log = log;
    this.config = config;
    this.api = api;

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

  startRepeatingCycle(service: Service, delayTime: number) {
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

  handleOnSet(value: boolean) {
    this.log.info('Setting switch state to', value);
  }
}
