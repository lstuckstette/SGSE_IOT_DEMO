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
let availableMethods = {methods: [], deviceID: undefined};

console.log("Started:");

/*
detectAvailableMethods().then(() => {
    console.log(JSON.stringify(availableMethods));


});
*/


function run() {
    if (!ioClient.connected) {
        ioClient = io.connect(serverAddress);
    }
}

//setInterval(run, 5000);

let ioClient = io.connect(serverAddress);
ioClient.on("connect", () => {
    console.log("socket.io connected!");
    detectAvailableMethods().then((data, err) => {
        console.log("AM: " + availableMethods.methods + " ID: " + availableMethods.deviceID);
        ioClient.emit("register", availableMethods);
    });
});


ioClient.on("request", async (data) => {
    //interpret request and send response:
    let retval = undefined;
    switch (data.method.toString()) {
        case "readCalculatedTemperature" :
            console.log("got readCTemp req!");
            retval = await readCalculatedTemperature();
            ioClient.emit('responseCTemp', {response: retval, deviceID: availableMethods.deviceID});
            break;
        case "readCalculatedLux" :
            console.log("got readCLux req!");
            retval = await readCalculatedLux();
            ioClient.emit('responseCLux', {response: retval, deviceID: availableMethods.deviceID});
            break;
        case "readDHT22Temperature" :
            console.log("got readDTemp req!");
            retval = await readDHT22Temperature();
            ioClient.emit('responseDTemp', {response: retval, deviceID: availableMethods.deviceID});
            break;
        case "readDHT22Humidity" :
            console.log("got readDHum req!");
            retval = await readDHT22Humidity();
            ioClient.emit('responseDHum', {response: retval, deviceID: availableMethods.deviceID});
            break;
        case "setLED":
            console.log("got setLed req!");
            if (data !== undefined)
                setLED(data.data);
            let currentValue = getLED();
            ioClient.emit('responseSLED', {response: "OK", deviceID: availableMethods.deviceID, value: currentValue});
            break;
        case "getLED":
            console.log("got readLed req!");
            retval = getLED();
            ioClient.emit('responseLED', {response: retval, deviceID: availableMethods.deviceID});
            break;
        default:
            client.emit("error", {error: "Unrecognised request: '" + data.method+"'!"});
    }
});

ioClient.on("disconnect", () => {
    console.log("socket.io disconnected!")
    let interval = setInterval(() => {
        console.log("retrying connection...");
        if (ioClient.connected) {
            clearInterval(interval);
            return;
        }
        ioClient.connect()
    }, 2000);
});

function reconnect() {

}

async function detectAvailableMethods() {
    return new Promise((resolve, reject) => {

        availableMethods = {methods: [], deviceID: undefined};
        availableMethods.methods.push("setLED");
        availableMethods.methods.push("getLED");
        readDHT22Temperature().catch((err) => {
            availableMethods.methods.push("readCalculatedTemperature");
            availableMethods.methods.push("readCalculatedLux");
            availableMethods.deviceID = 1;
            resolve();
        }).then((data, err) => {
            if (data !== undefined) {
                availableMethods.methods.push("readDHT22Temperature");
                availableMethods.methods.push("readDHT22Humidity");
                availableMethods.deviceID = 2;
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
    let ledStatus = led.readSync();
    if(ledStatus === 1){
        return true;
    }
    return false;
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
