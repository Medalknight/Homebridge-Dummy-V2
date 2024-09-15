const { Service, Characteristic } = require('homebridge');

let AutoOnSwitch = null;

module.exports = (api) => {
  api.registerAccessory('homebridge-dummy-v2', 'DummySwitch', DummySwitchAccessory);
};

class DummySwitchAccessory {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;

    // Initial switch state
    this.switchState = false;

    // Default time to auto turn on the switch (in ms)
    this.autoOnTime = (config.autoOnTime || 5000);

    // Homebridge service
    this.service = new Service.Switch(config.name || 'Dummy Switch');

    // Handle 'On' characteristic
    this.service.getCharacteristic(Characteristic.On)
      .onGet(this.handleOnGet.bind(this))
      .onSet(this.handleOnSet.bind(this));

    // Start auto-toggle process on bridge start
    this.startAutoToggle();
  }

  // Getter for switch state
  handleOnGet() {
    return this.switchState;
  }

  // Setter for switch state
  handleOnSet(value) {
    this.switchState = value;
    this.log(`Switch is turned ${value ? 'ON' : 'OFF'}`);

    if (value) {
      // Automatically turn off after 5 seconds
      setTimeout(() => {
        this.switchState = false;
        this.service.updateCharacteristic(Characteristic.On, false);
        this.log('Switch turned OFF automatically');
      }, 5000);
    }
  }

  // Auto-toggle process
  startAutoToggle() {
    setInterval(() => {
      this.switchState = true;
      this.service.updateCharacteristic(Characteristic.On, true);
      this.log('Switch turned ON automatically');

      // Turn off after 5 seconds
      setTimeout(() => {
        this.switchState = false;
        this.service.updateCharacteristic(Characteristic.On, false);
        this.log('Switch turned OFF automatically');
      }, 5000);
    }, this.autoOnTime);
  }

  // Return services to Homebridge
  getServices() {
    return [this.service];
  }
}
