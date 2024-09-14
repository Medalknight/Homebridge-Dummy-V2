let Service, Characteristic; // Variablen ohne const und keine Initialisierung

module.exports = (homebridge) => {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory('homebridge-dummy-repeat-switch', 'RepeatSwitch', RepeatSwitch);
};

class RepeatSwitch {
    constructor(log, config) {
        this.log = log;
        this.name = config.name || 'Repeat Switch';
        this.offTimeInMinutes = config.offTimeInMinutes || 5; // Standard-Zeit in Minuten
        this.switchState = false; // Switch ist standardmäßig aus

        // Service für den Dummy-Switch
        this.service = new Service.Switch(this.name);
        this.service.getCharacteristic(Characteristic.On)
            .on('get', this.getSwitchState.bind(this))
            .on('set', this.setSwitchState.bind(this));
    }

    // Status des Switches abfragen
    getSwitchState(callback) {
        callback(null, this.switchState);
    }

    // Status des Switches setzen
    setSwitchState(state, callback) {
        this.switchState = state;
        this.log(`Switch state set to ${this.switchState}`);

        if (this.switchState) {
            this.startSwitchTimer();
        } else {
            clearTimeout(this.switchTimer);
        }

        callback(null);
    }

    // Timer starten, um den Switch nach der konfigurierten Zeit wieder auszuschalten
    startSwitchTimer() {
        clearTimeout(this.switchTimer);

        this.log(`Switch will turn off in ${this.offTimeInMinutes} minute(s).`);
        
        this.switchTimer = setTimeout(() => {
            this.switchState = false;
            this.service.getCharacteristic(Characteristic.On).updateValue(this.switchState);
            this.log('Switch turned off.');

            this.log(`Switch will turn on again shortly.`);
            this.startSwitchCycle(); // Wiederholung starten
        }, this.offTimeInMinutes * 60 * 1000);
    }

    // Der Switch wird nach dem Ausschalten nach einer kurzen Zeit wieder aktiviert
    startSwitchCycle() {
        setTimeout(() => {
            this.switchState = true;
            this.service.getCharacteristic(Characteristic.On).updateValue(this.switchState);
            this.log('Switch turned on again.');
            this.startSwitchTimer(); // Zyklus wiederholen
        }, 5000); // Warten Sie 5 Sekunden, bevor Sie den Switch wieder einschalten
    }

    getServices() {
        return [this.service];
    }
}
