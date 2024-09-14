"use strict";

// Service und Characteristic werden von der homebridge-API bereitgestellt
let Service, Characteristic;
const { HomebridgeDummyVersion } = require('./package.json'); // Version aus package.json
const storage = require('node-persist'); // Storage-Modul für persistente Speicherung von Zuständen

module.exports = (api) => {
  // Registrierung des Zubehörs
  api.registerAccessory("homebridge-dummy", "DummySwitch", DummySwitch);
}

function DummySwitch(log, config, api) { // Der Constructor nimmt jetzt auch die api entgegen
  this.log = log;
  this.name = config.name;
  this.stateful = config.stateful;
  this.dimmer = config.dimmer;
  this.brightness = config.brightness || 0;
  this.brightnessStorageKey = this.name + "Brightness";
  this.reverse = config.reverse;
  this.time = config.time || 1000; // Standardwert gesetzt, falls nicht konfiguriert
  this.resettable = config.resettable;
  this.random = config.random;
  this.disableLogging = config.disableLogging;

  // API und Cache-Verzeichnis
  this.api = api; // Homebridge-API-Instanz speichern
  this.cacheDirectory = this.api.user.persistPath(); // Pfad zur Persistenz

  // Initialisierung des Speichers
  storage.initSync({ dir: this.cacheDirectory, forgiveParseErrors: true });

  // Festlegen des Service-Typs: Dimmer oder Switch
  if (this.dimmer) {
    this._service = new Service.Lightbulb(this.name);
    this.modelString = "Dummy Dimmer";
  } else {
    this._service = new Service.Switch(this.name);
    this.modelString = "Dummy Switch";
  }

  // Accessory Information Service
  this.informationService = new Service.AccessoryInformation();
  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, 'Homebridge')
    .setCharacteristic(Characteristic.Model, this.modelString)
    .setCharacteristic(Characteristic.FirmwareRevision, HomebridgeDummyVersion)
    .setCharacteristic(Characteristic.SerialNumber, 'Dummy-' + this.name.replace(/\s/g, '-'));

  // Schalter On/Off
  this._service.getCharacteristic(Characteristic.On)
    .on('set', this._setOn.bind(this));

  // Dimmer: Helligkeit hinzufügen
  if (this.dimmer) {
    this._service.getCharacteristic(Characteristic.Brightness)
      .on('get', this._getBrightness.bind(this))
      .on('set', this._setBrightness.bind(this));
  }

  // Initialisierung des Schalterzustands
  if (this.reverse) {
    this._service.setCharacteristic(Characteristic.On, true);
  }

  // Stateful Switch: Zustand aus Storage laden
  if (this.stateful) {
    const cachedState = storage.getItemSync(this.name);
    this._service.setCharacteristic(Characteristic.On, cachedState === undefined ? false : cachedState);
  }

  // Dimmer: Helligkeit aus Storage laden
  if (this.dimmer) {
    const cachedBrightness = storage.getItemSync(this.brightnessStorageKey);
    this._service.setCharacteristic(Characteristic.Brightness, cachedBrightness === undefined ? 0 : cachedBrightness);
    this._service.setCharacteristic(Characteristic.On, cachedBrightness > 0);
  }
}

DummySwitch.prototype.getServices = function () {
  // Rückgabe der verfügbaren Dienste
  return [this.informationService, this._service];
}

// Helligkeit abrufen (Dimmer-Modus)
DummySwitch.prototype._getBrightness = function (callback) {
  if (!this.disableLogging) {
    this.log("Getting brightness: " + this.brightness);
  }
  callback(null, this.brightness); // Rückgabe des aktuellen Helligkeitswerts
}

// Helligkeit setzen (Dimmer-Modus)
DummySwitch.prototype._setBrightness = function (brightness, callback) {
  if (!this.disableLogging) {
    this.log("Setting brightness: " + brightness);
  }

  this.brightness = brightness;
  storage.setItemSync(this.brightnessStorageKey, brightness); // Helligkeitswert speichern

  callback();
}

// Schalterzustand setzen
DummySwitch.prototype._setOn = function (on, callback) {
  const delay = this.random ? randomize(this.time) : this.time;
  const msg = `Setting switch to ${on}`;

  if (this.random && !this.stateful) {
    this.log(msg + ` (random delay ${delay}ms)`);
  } else if (!this.disableLogging) {
    this.log(msg);
  }

  // Automatisches Zurücksetzen des Schalters nach Ablauf der Zeit
  if (on && !this.reverse && !this.stateful) {
    if (this.resettable) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this._service.setCharacteristic(Characteristic.On, false);
    }, delay);
  } else if (!on && this.reverse && !this.stateful) {
    if (this.resettable) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this._service.setCharacteristic(Characteristic.On, true);
    }, delay);
  }

  // Stateful-Schalterzustand speichern
  if (this.stateful) {
    storage.setItemSync(this.name, on);
  }

  callback();
}

// Zufälligen Verzögerungswert generieren
function randomize(time) {
  return Math.floor(Math.random() * (time + 1));
}
