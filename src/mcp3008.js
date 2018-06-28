/*
SOURCE: https://github.com/fiskeben/mcp3008.js
modified by lstuckstette 2018
 */
let SPI = require('pi-spi');

let channels = [],
    device = '/dev/spidev0.0',
    spi;

function isLegalChannel(channelNumber) {
    if (typeof channelNumber !== 'number' || channelNumber < 0 || channelNumber > 7) {
        throw new Error("Channel must be a number from 0 to 7");
    }
}

function read(channel) {
    if (spi === undefined)
        return;
    isLegalChannel(channel);

    let txBuf = new Buffer(3);
    txBuf.writeUInt8(1, 0);
    txBuf.writeUInt8((8 + channel) << 4, 1);
    txBuf.writeUInt8(0, 2);

    return new Promise((resolve, reject) => {
        spi.transfer(txBuf, function (err, buffer) {
            if (err) reject(err);

            let value = ((buffer[1] & 3) << 8) + buffer[2];
            resolve(value);
        });
    });
}

function isAvailable(){
    return spi !== undefined;
}


var Mcp3008 = function (dev) {
    device = dev || device;
    spi = SPI.initialize(device);
    this.read = read;
    this.isAvailable = isAvailable;

    this.close = function () {
        spi.close();
    }
};

module.exports = Mcp3008;
