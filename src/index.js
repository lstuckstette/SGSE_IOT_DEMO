let Cylon = require("cylon");
let dht22 = require("node-dht-sensor");
let mcp3008 = require("./mcp3008");
let adc = new mcp3008();
let tempChannel = 1;
let lightChannel = 2;

console.log("Started:");

Cylon.robot({
    connections: {
        raspi: {adaptor: 'raspi'}
    },

    devices: {
        led: {driver: 'led', pin: 11}
    },

    work: function (my) {
        every((1).second(), my.led.toggle);
        //every((2).second(), readDHT22);
        every((1).second(), readRawTemperature);
        every((1).second(), readRawBrightness);

    }
}).start();

async function readRawTemperature() {
    let value = await(adc.read(tempChannel));
    console.log("raw temp: " + value);
    return value;
}

async function readRawBrightness() {
    let value = await(adc.read(lightChannel));
    console.log("raw brightness: " + value);
    return value;
}

async function readDHT22Temperature() { // let derp = await readDHT22Temperature();
    return new Promise((resolve, reject) => {
        dht22.read(22, 27, function (err, temperature, humidity) { // 22= DHT22, 27 = GPIO27 !!
            if (!err) {
                //  console.log('temp: ' + temperature.toFixed(1) + 'C, ' +
                //      'humidity: ' + humidity.toFixed(1) + '%');
                resolve(temperature.toFixed(1));
            } else {
                console.log("Error reading DHT22! not connected? " + err);
                reject(err);

            }
        });
    });
}

async function readDHT22Humidity() { // let derp = await readDHT22Humidity();
    return new Promise((resolve, reject) => {
        dht22.read(22, 27, function (err, temperature, humidity) { // 22= DHT22, 27 = GPIO27 !!
            if (!err) {
                //  console.log('temp: ' + temperature.toFixed(1) + 'C, ' +
                //      'humidity: ' + humidity.toFixed(1) + '%');
                resolve(humidity.toFixed(1));
            } else {
                console.log("Error reading DHT22! not connected? " + err);
                reject(err);

            }
        });
    });
}

function readDHT22() {


}
