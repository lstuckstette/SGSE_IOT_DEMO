let Cylon = require("cylon");
let dht22 = require("node-dht-sensor");

console.log("Started:");

Cylon.robot({
    connections: {
        raspi: { adaptor: 'raspi' }
    },

    devices: {
        led: { driver: 'led', pin: 11 }
    },

    work: function(my) {
        every((2).second(), my.led.toggle);

        dht22.read(22, 27, function(err, temperature, humidity) { // 22= DHT22, 27 = GPIO27 !!
            if (!err) {
                console.log('temp: ' + temperature.toFixed(1) + 'C, ' +
                    'humidity: ' + humidity.toFixed(1) + '%'
                );
            }
        });
    }
}).start();