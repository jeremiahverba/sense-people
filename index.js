"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var i2c = require("i2c-bus");
// The person sensor has the I2C ID of hex 62, or decimal 98.
var PERSON_SENSOR_I2C_ADDRESS = 0x62;
// How long to pause between sensor polls.
var PERSON_SENSOR_DELAY = 200;
// The Pico doesn't support board.I2C(), so check before calling it. If it isn't
// present then we assume we're on a Pico and call an explicit function.
function main() {
    var bus = i2c.openSync(0);
    // For debugging purposes print out the peripheral addresses on the I2C bus.
    // 98 (0x62 in hex) is the address of our person sensor, and should be
    // present in the list. Uncomment the following three lines if you want to see
    // what I2C addresses are found.
    setInterval(function () { return console.log("bus scan: ", bus.scanSync()); }, PERSON_SENSOR_DELAY);
    while (true) {
        var buffer = Buffer.alloc(38);
        var result = bus.i2cReadSync(PERSON_SENSOR_I2C_ADDRESS, 38, buffer);
        if (!result) {
            console.log("nothing to read!");
            sleep(PERSON_SENSOR_DELAY);
        }
        var model = convertBufferToModel(buffer);
        console.log("model: ", model);
        sleep(PERSON_SENSOR_DELAY);
    }
}
main();
function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
function convertBufferToModel(buffer) {
    var reserved = buffer.readInt16LE(0);
    var length = buffer.readInt16LE(2);
    var number_of_Faces = buffer.readInt8(4);
    var faces = [];
    for (var i = 0; i < number_of_Faces; i++) {
        var offset = i * 8;
        var face = {
            Face_Box_Confidence: buffer.readInt8(offset + 5),
            Face_Box_Left: buffer.readInt8(offset + 6),
            Face_Box_Top: buffer.readInt8(offset + 7),
            Face_Box_Right: buffer.readInt8(offset + 8),
            Face_Box_Bottom: buffer.readInt8(offset + 9),
            Face_Recognition_Confidence: buffer.readInt8(offset + 10),
            Face_Recognition_ID: buffer.readInt8(offset + 11),
            Face_Is_Looking_At: buffer.readInt8(offset + 12),
        };
        faces.push(face);
    }
    var checksum = buffer.readInt16LE();
    var model = {
        Reserved: reserved,
        Length: length,
        Number_of_Faces: number_of_Faces,
        Faces: faces,
        Checksum: checksum,
    };
    return model;
}
