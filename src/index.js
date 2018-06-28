let Cylon = require("cylon");
let W3CWebSocket = require('websocket').w3cwebsocket;
let dht22 = require("node-dht-sensor");
let mcp3008 = require("./mcp3008");
let adc = new mcp3008();
let tempChannel = 1;
let lightChannel = 2;
let availableMethods = {methods: []};

console.log("Started:");

Cylon.robot({
    connections: {
        raspi: {adaptor: 'raspi'}
    },

    devices: {
        led: {driver: 'led', pin: 11}
    },

    work: function (my) {
        detectAvailableMethods().then(() => {
                console.log(JSON.stringify(availableMethods));

                every((1).second(), my.led.toggle);
                //every((2).second(), readDHT22);
                //every((1).second(), readCalculatedTemperature);
                //every((1).second(), readCalculatedLux);}
            }
        );


    }
});

Cylon.start();


async function detectAvailableMethods() {
    return new Promise((resolve, reject) => {
        availableMethods.methods.push("setLED");
        readDHT22Temperature().catch((err) => {
            availableMethods.methods.push("readCalculatedTemperature");
            availableMethods.methods.push("readCalculatedLux");
            resolve();
        }).then((data, err) => {
              if (data !== undefined) {
                availableMethods.methods.push("readDHT22Temperature");
                availableMethods.methods.push("readDHT22Humidity");
            }
            resolve();
        });
    });
}

function setLED(state) {
    if (state) {
        Cylon.robot.led.turn_on();
    } else {
        Cylon.robot.led.turn_off();
    }

}

async function readRawTemperature() {
    let value = await(adc.read(tempChannel));
    return value;
}

async function readCalculatedTemperature() {

    let rawData = await readRawTemperature();

    let volts = (rawData / 1023) * 3.3;
    let ohms = ((3.3 * 10000) - (volts * 10000)) / volts;
    let lnohms = Math.log(ohms); // = ln(x)

    // R@25°C=8600, R (-6.2%/C @ 25C) Mil Ratio X
    let a = 0.001860902033483;
    let b = 0.000156942702230;
    let c = 0.000000094148064;

    let t1 = (b * lnohms); // b[ln(ohm)]
    let c2 = c * lnohms; // c[ln(ohm)]
    let t2 = Math.pow(c2, 3); // c[ln(ohm)]^3
    let temp = 1 / (a + t1 + t2); //calcualte temperature
    let tempC = temp - 273.15 - 4; //K to C
    console.log("read TMP: " + tempC);
    return tempC;
}

async function readRawBrightness() {
    let value = await(adc.read(lightChannel));
    return value;
}

async function readCalculatedLux() {
    //cout << "raw: " << rawData;
    let rawData = await readRawBrightness();

    let MAX_ADC_READING = 1023;
    let ADC_REF_VOLTAGE = 3.3;
    let REF_RESISTANCE = 10000;
    let LUX_CALC_SCALAR = 65721;  //seeded
    let LUX_CALC_EXPONENT = -0.7081; //seeded

    let resistorVoltage = rawData / MAX_ADC_READING * ADC_REF_VOLTAGE;

    let ldrVoltage = ADC_REF_VOLTAGE - resistorVoltage;

    let ldrResistance = ldrVoltage / resistorVoltage * REF_RESISTANCE;

    //cout << " ldrResistance: " <<  ldrResistance << "  -  ";

    let ldrLux = LUX_CALC_SCALAR * Math.pow(ldrResistance, LUX_CALC_EXPONENT);
    console.log("read LUX: " + ldrLux);
    return ldrLux;
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
