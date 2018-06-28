const Gpio = require('onoff').Gpio;
const dht22 = require("node-dht-sensor");
const mcp3008 = require("./mcp3008");
const WebSocketClient = require('websocket').client;
const io = require('socket.io-client');

let led = new Gpio(17, 'out');
let serverAddress = 'ws://ec2-18-191-175-39.us-east-2.compute.amazonaws.com:4811';
let adc = new mcp3008();
let tempChannel = 1;
let lightChannel = 2;
let availableMethods = {methods: []};

console.log("Started:");

detectAvailableMethods().then(() => {
    console.log(JSON.stringify(availableMethods));
});

function run(){

}

//setLED(true);

let ioClient = io.connect(serverAddress);

ioClient.on("connect", () => {
    console.log("socket.io connected!");
    ioClient.emit("register", availableMethods);
});



ioClient.on("request", (data) => {
    //interpret request and send response:
    let retval = undefined;
    switch (data.method) {
        case "readCalculatedTemperature" :
            retval = readCalculatedTemperature();
            client.emit('response', {response: retval});
            break;
        case "readCalculatedLux" :
            retval = readCalculatedLux();
            client.emit('response', {response: retval});
            break;
        case "readDHT22Temperature" :
            retval = readDHT22Temperature();
            client.emit('response', {response: retval});
            break;
        case "readDHT22Humidity" :
            retval = readDHT22Humidity();
            client.emit('response', {response: retval});
            break;
        case "setLED":
            setLED(data.data);
            client.emit('response', {response: "OK"});
            break;
        case "getLED":
            retval = getLED();
            client.emit('response', {response: retval});
            break;
        default:
            client.emit("error", {error: "Unrecognised request!"});
    }
});

ioClient.on("disconnect", () => {
    console.log("socket.io disconnected!")
});

async function detectAvailableMethods() {
    return new Promise((resolve, reject) => {
        availableMethods.methods.push("setLED");
        availableMethods.methods.push("getLED");
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
        led.writeSync(1);
    } else {
        led.writeSync(0);
    }

}

function getLED() {
    return led.readSync();
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
/**/
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
