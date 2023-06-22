import * as i2c from "i2c-bus";
// The person sensor has the I2C ID of hex 62, or decimal 98.
const PERSON_SENSOR_I2C_ADDRESS = 0x62;

// How long to pause between sensor polls.
const PERSON_SENSOR_DELAY = 200;

// The Pico doesn't support board.I2C(), so check before calling it. If it isn't
// present then we assume we're on a Pico and call an explicit function.
function main(): void {
  const bus = i2c.openSync(0);
  // For debugging purposes print out the peripheral addresses on the I2C bus.
  // 98 (0x62 in hex) is the address of our person sensor, and should be
  // present in the list. Uncomment the following three lines if you want to see
  // what I2C addresses are found.
  setInterval(
    () => console.log("bus scan: ", bus.scanSync()),
    PERSON_SENSOR_DELAY
  );

  while (true) {
    const buffer = Buffer.alloc(38);
    const result = bus.i2cReadSync(PERSON_SENSOR_I2C_ADDRESS, 38, buffer);
    if (!result) {
      console.log("nothing to read!");
      sleep(PERSON_SENSOR_DELAY);
    }
    const model = convertBufferToModel(buffer);
    console.log("model: ", model);
    sleep(PERSON_SENSOR_DELAY);
  }
}
main();
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface FaceData {
  Face_Box_Confidence: number;
  Face_Box_Left: number;
  Face_Box_Top: number;
  Face_Box_Right: number;
  Face_Box_Bottom: number;
  Face_Recognition_Confidence: number;
  Face_Recognition_ID: number;
  Face_Is_Looking_At: number;
}

export interface PersonSensorDataModel {
  //first 2 bytes are for reserved
  Reserved: number;
  // next 2 bytes are for data length:
  Length: number;
  Number_of_Faces: number;
  Faces: Array<FaceData>;
  //last 2 bytes are checksum
  Checksum: number;
}

function convertBufferToModel(buffer: Buffer): PersonSensorDataModel {
  const reserved = buffer.readInt16LE(0);
  const length = buffer.readInt16LE(2);
  const number_of_Faces = buffer.readInt8(4);
  const faces: Array<FaceData> = [];
  for (let i = 0; i < number_of_Faces; i++) {
    const offset = i * 8;
    const face: FaceData = {
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
  const checksum = buffer.readInt16LE();

  const model: PersonSensorDataModel = {
    Reserved: reserved,
    Length: length,
    Number_of_Faces: number_of_Faces,
    Faces: faces,
    Checksum: checksum,
  };
  return model;
}
