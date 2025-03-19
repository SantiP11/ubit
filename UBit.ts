
/**
* Utilice este archivo para definir funciones y bloques personalizados.
* Lea más en https://makecode.microbit.org/blocks/custom
*/

enum Sensor {
    Temperatura,
    Luz,
    Sonido,
    Aceleracion,
    Brujula,
    Rotacion,
    Tiempo,
    Fuerza_Magnetica
}

let BUFF_LEN = 50
let I2C_TIME_INTERVAL = 500
let col = 0
let row = 0
let str = ""
let StopI2CScreen = 0

let newLedMatrix = pins.createBuffer(25);
let lastLedMatrix = pins.createBuffer(25);

// Declare a 2D array for the matrix (rows are declared here)


// Padding function
function padEnd(message: string, length: number, char: string) {
    while (message.length < length) {
        message = "" + message + char
    }
    return message
}

//Transforma el string a buffer, lo rellena y lo manda a la UBit
function sendWiFiBuffer(message1: string, message2: string) {
    // Calculate available space for each message after adding '?'

    // Construct the formatted message with '?' at positions
    let finalMessage = "?" + message1 + "?" + message2 + "?";

    // Pad the message to BUFF_LEN with spaces
    finalMessage = padEnd(finalMessage, BUFF_LEN, " ");

    // Create the buffer
    let buffer2 = pins.createBuffer(BUFF_LEN);
    for (let i = 0; i < BUFF_LEN; i++) {
        buffer2.setNumber(NumberFormat.UInt8LE, i, finalMessage.charCodeAt(i));
    }

    // Send buffer via I2C
    pins.i2cWriteBuffer(7, buffer2, false);
}

//Transforma el string a buffer, lo rellena y lo manda a la UBit
function sendTextBuffer(message: string) {
    // Ensure the message does not exceed BUFF_LEN - 1 to make space for '%'
    if (message.length > BUFF_LEN - 1) {
        message = message.slice(0, BUFF_LEN - 1);
    }

    // Add '%' at the start and shift the message
    message = "%" + message + "%";

    // Pad the message to BUFF_LEN with spaces
    message = padEnd(message, BUFF_LEN, " ");

    let buffer2 = pins.createBuffer(BUFF_LEN);
    for (let i = 0; i < BUFF_LEN; i++) {
        buffer2.setNumber(NumberFormat.UInt8LE, i, message.charCodeAt(i));
    }

    // Send buffer via I2C
    pins.i2cWriteBuffer(7, buffer2, false);
}

function checkMovement(): Gesture {
    if (input.isGesture(Gesture.Shake)) {
        return Gesture.Shake;
    } else if (input.isGesture(Gesture.LogoUp)) {
        return Gesture.LogoUp;
    } else if (input.isGesture(Gesture.LogoDown)) {
        return Gesture.LogoDown;
    } else if (input.isGesture(Gesture.TiltLeft)) {
        return Gesture.TiltLeft;
    } else if (input.isGesture(Gesture.TiltRight)) {
        return Gesture.TiltRight;
    } else if (input.isGesture(Gesture.ScreenUp)) {
        return Gesture.ScreenUp;
    } else if (input.isGesture(Gesture.ScreenDown)) {
        return Gesture.ScreenDown;
    } else if (input.isGesture(Gesture.FreeFall)) {
        return Gesture.FreeFall;
    } else if (input.isGesture(Gesture.ThreeG)) {
        return Gesture.ThreeG;
    } else if (input.isGesture(Gesture.SixG)) {
        return Gesture.SixG;
    } else if (input.isGesture(Gesture.EightG)) {
        return Gesture.EightG;
    }
    return null;  // No gesture detected
}



function copyBuffer(original: Buffer): Buffer {
    let copy = pins.createBuffer(original.length);
    copy.write(0, original);
    return copy;
}

function isAllZero(buffer: Buffer) {
    // Recorre todo el buffer y devuelve 'true' si todos los valores son 0
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] !== 0) {
            return false; // Si encuentra un valor distinto de 0, retorna false
        }
    }
    return true; // Si todos los valores son 0, retorna true
}


// Transforma el string a buffer, lo rellena y lo manda a la UBit. 
// Se asegura que el primer caracter sea # por ser un icono
function sendIconBuffer() {
    let LedMatrix = pins.createBuffer(25);
    let buffer2 = pins.createBuffer(BUFF_LEN);
    
    for (let i = 0; i <= 24; i++) {
        row = Math.floor(i / 5)
        col = i % 5
        LedMatrix.setNumber(NumberFormat.UInt8LE, i, led.point(row, col) ? 1 : 0);
    }

    if (!LedMatrix.equals(lastLedMatrix) || isAllZero(LedMatrix)) {
        lastLedMatrix = copyBuffer(LedMatrix);
        return;
    }
    

    // Place '#' at the first position
    buffer2.setNumber(NumberFormat.UInt8LE, 0, "#".charCodeAt(0));

    // Copy the 25-byte matrixBuffer into buffer2, shifting to the right
    for (let i = 0; i < 25; i++) {
        buffer2.setNumber(NumberFormat.UInt8LE, i + 1, LedMatrix.getNumber(NumberFormat.UInt8LE, i));
    }

    // Fill the rest with spaces (ASCII 32)
    for (let i = 26; i < BUFF_LEN; i++) {
        buffer2.setNumber(NumberFormat.UInt8LE, i, " ".charCodeAt(0));
    }

    // Send the buffer via I2C
    pins.i2cWriteBuffer(7, buffer2, false);
}




/**
 * Custom blocks
 */
//% weight=100 color=#c845da icon="\uf29a"
namespace UBit {

    /**
    * Reproduce el texto o número por audio en la UBit y lo muestra en la pantalla.
    */
    //% block="Mostrar cadena $message con audio"
    //% message.shadow="text"
    export function RepTextwithScreen(message: any) {
        let textString = message.toString(); // Convert number to string if needed
        StopI2CScreen = 1;
        sendTextBuffer(textString);
        basic.showString(textString);
        StopI2CScreen = 0;
    }


    /**
    * Reproduce el texto escrito por audio en la UBit.
    */
    //% block="Reproducir $message por audio"
    //% message.shadow="text"
    export function RepText(message: any) {
        let text = message.toString(); // Convert number to string if needed
        StopI2CScreen = 1
        sendTextBuffer(text)
        StopI2CScreen = 0
    }

    /**
    * Conecta la UBit a la red deseada. 
    * En caso de no usar este bloque se conectara a la red de Ceibal.
    */
    //% block="Conectarse a la red $WiFi con la contraseña $Pssw"
    export function ConWiFi(WiFi: string, Pssw: string) {
        StopI2CScreen = 1
        sendWiFiBuffer(WiFi, Pssw)
        StopI2CScreen = 0
        str = ""
    }


    /*ME QUEDE ACAAAAAAAAAAAA , HAY QUE TESTEAR PARA ABAJO

    /**
    * Reproduce el texto o número por audio en la UBit y lo muestra en la pantalla.
    */
    //% block="Mostrar numero $message con audio"
    export function RepNumtwithScreen(message: number) {
        let textString = message.toString(); // Convert number to string if needed
        StopI2CScreen = 1;
        sendTextBuffer(textString);
        basic.showString(textString);
        StopI2CScreen = 0;
    }


    /**
    * Habilita/deshabilita la salida por audio de lo 
    * íconos vistos en el display de la micro:bit.
    */
    //% block="Activar iconos con audio $yes"
    //% yes.shadow="toggleOnOff"
    export function Icon(yes: boolean) {
        if(yes) {
            loops.everyInterval(I2C_TIME_INTERVAL, function () {
                if (StopI2CScreen == 0)
                sendIconBuffer();
            })
        }    
    }


    /**
     * Get the temperature in Celsius from a specified micro:bit.
     * @param sensorNumber The radio group number to communicate with a micro:bit.
     */
    //% block="temperatura (°C) desde micro:bit $sensorNumber"
    export function getTemperature(sensorNumber: number): number {
        let temperature: number = -1; // Default value indicating no data received

        radio.setGroup(sensorNumber);
        radio.sendString("Temp");

        control.waitMicros(200); // Wait to ensure the temperature has been received

        // Wait for the temperature to be received
        radio.onReceivedValue(function (name: string, value: number) {
            if (name == "Tem") {
                temperature = value; // Capture the temperature value
            }
        });

        return temperature;
    }

    /**
 * Tomar el nivel de luz desde una microbit externa
 * @param sensorNumber The radio group number to communicate with a micro:bit.
 */
    //% block="Nivel de luz desde micro:bit $sensorNumber"
    export function getLight(sensorNumber: number): number {
        let light: number = -1; // Default value indicating no data received

        radio.setGroup(sensorNumber);
        radio.sendString("Lig");

        // Wait for the temperature to be received
        radio.onReceivedValue(function (name: string, value: number) {
            if (name == "Lig") {
                light = value; // Capture the temperature value
            }
        });

        control.waitMicros(200); // Wait to ensure the temperature has been received

        return light;
    }

    /**
* Tomar el nivel de sonido desde una microbit externa
* @param sensorNumber The radio group number to communicate with a micro:bit.
*/
    //% block="Nivel de sonido desde micro:bit $sensorNumber"
    export function getSound(sensorNumber: number): number {
        let sound: number = -1; // Default value indicating no data received

        radio.setGroup(sensorNumber);
        radio.sendString("Sou");

        control.waitMicros(200); // Wait to ensure the temperature has been received

        // Wait for the temperature to be received
        radio.onReceivedValue(function (name: string, value: number) {
            if (name == "Sou") {
                sound = value; // Capture the temperature value
            }
        });

        return sound;
    }

    /**
* Tomar la dirección de la brujula desde una microbit externa
* @param sensorNumber The radio group number to communicate with a micro:bit.
*/
    //% block="Dirección de la brujula de la micro:bit $sensorNumber"
    export function getDirection(sensorNumber: number): number {
        let direction: number = -1; // Default value indicating no data received

        radio.setGroup(sensorNumber);
        radio.sendString("Dir");

        control.waitMicros(200); // Wait to ensure the temperature has been received

        // Wait for the temperature to be received
        radio.onReceivedValue(function (name: string, value: number) {
            if (name == "Dir") {
                direction = value; // Capture the temperature value
            }
        });

        return direction;
    }

    /**
    * Detecta si el micro:bit está realizando un gesto y ejecuta una acción.
    */
    //% block="si $gesture en micro:bit $sensorNumber"
    export function onGestureDetect(sensorNumber: number, gesture: Gesture, handler: () => void): void {
        radio.setGroup(sensorNumber); // Configura el grupo de radio con el número del sensor.
        radio.onReceivedValue(function (name: string, value: Gesture) {
            if (name == "Ges") {
                if (value == gesture) { 
                    handler(); // Ejecuta la acción
                }
            }
        });
    }


    /**
     * Se elige un canal de radio por el cual mandarle los 
     * datos que pida la micro:bit conectada a la UBit.
     */
    //% block="Enviar datos solicitados UBit $int"
    export function SendAllSenInt(int: number) {
        radio.setGroup(int);
        radio.onReceivedString(function (receivedString) {
            switch (receivedString) {
                case "Tem": {
                    radio.sendValue("Tem", input.temperature());
                    break;
                }
                case "Lig": {
                    radio.sendValue("Lig", input.lightLevel());
                    break;
                }
                case "Sou": {
                    radio.sendValue("Sou", input.soundLevel());
                    break;
                }
                case "Dir": {
                    radio.sendValue("Dir", input.compassHeading());
                    break;
                }
                default: {
                    break;
                }
            }

            // Detectar movimiento
            let acceler = checkMovement();
            if (acceler != null) {
                radio.sendValue("Ges", acceler);
            }
        });
    }
    
}