
/**
* Utilice este archivo para definir funciones y bloques personalizados.
* Lea más en https://makecode.microbit.org/blocks/custom
*/

let _remoteLight: number = -999; // Variable to store the last received temperature
let _waitingForLight: boolean = false; // Flag to indicate if we are currently waiting for a response
let _responseLight: boolean = false; // Flag to indicate if a response came back during the wait

let _remoteTemperature: number = -999; // Variable to store the last received temperature
let _waitingForTemperature: boolean = false; // Flag to indicate if we are currently waiting for a response
let _responseTemperature: boolean = false; // Flag to indicate if a response came back during the wait

let _remoteDirection: number = -999; // Variable to store the last received temperature
let _waitingForDirection: boolean = false; // Flag to indicate if we are currently waiting for a response
let _responseDirection: boolean = false; // Flag to indicate if a response came back during the wait

let _remoteSound: number = -999; // Variable to store the last received temperature
let _waitingForSound: boolean = false; // Flag to indicate if we are currently waiting for a response
let _responseSound: boolean = false; // Flag to indicate if a response came back during the wait

// Stores the last received number
let lastReceivedNumber = "";

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

// Function to handle different messages
function handleMessage(msg: string): void {
    if (msg == "Tem") {
        radio.sendValue("Tem", input.temperature());
    } else if (msg == "Lig") {
        radio.sendValue("Lig", input.lightLevel());
    } else if (msg == "Sou") {
        radio.sendValue("Sou", input.soundLevel());
    } else if (msg == "Dir") {
        radio.sendValue("Dir", input.compassHeading());
    } else if (msg == "-1") {
        radio.sendString("Hello!");
    }
}


let ligFlag = false;
let ligValue = 0;

let temFlag = false;
let temValue = 0;

let souFlag = false;
let souValue = 0;

let dirFlag = false;
let dirValue = 0;

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
    export function RepTextwithScreen(message: string | number) {
        let textString;
        if (typeof message !== "string"){
            textString = message.toString(); // Convert number to string if needed
        } else {
            textString = message;
        }
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
                if (StopI2CScreen == 0){
                    sendIconBuffer();
                }  
            })
        }    
    }


    /**
     * Get the temperature in Celsius from a specified micro:bit.
     * @param sensorNumber The radio group number to communicate with a micro:bit.
     */
    //% block="temperatura (°C) desde micro:bit externa"
    export function getTemperature(): number {
        // Reset state for this request
        _remoteTemperature = -999; // Default/error value
        _waitingForTemperature = true;
        _responseTemperature = false;

        // Send the request signal
        radio.sendString("Tem");

        // Wait for a response with a timeout
        const startTime = control.millis();
        const timeout = 1000; // 1000 ms = 1 second timeout

        while (control.millis() - startTime < timeout) {
            if (_responseTemperature) {
                // Response arrived (handler set _responseReceived and _remoteTemperature)
                // _waitingForTemperature should already be false from the handler
                return _remoteTemperature;
            }
            // Pause briefly to allow background tasks (like radio receive) to run
            basic.pause(20);
        }

        // If loop finishes without _responseReceived being true, it's a timeout
        _waitingForTemperature = false; // Ensure we are no longer waiting
        // serial.writeLine("Timeout waiting for remote temp"); // Optional debug message
        return -999; // Indicate timeout/failure
    }

    /**
 * Tomar el nivel de luz desde una micro:bit externa
 */
    //% block="Nivel de luz desde micro:bit externa"
    export function getLight(): number {
        // Reset state for this request
        _remoteLight = -999; // Default/error value
        _waitingForLight = true;
        _responseLight = false;

        // Send the request signal
        radio.sendString("Lig");

        // Wait for a response with a timeout
        const startTime = control.millis();
        const timeout = 1000; // 1000 ms = 1 second timeout

        while (control.millis() - startTime < timeout) {
            if (_responseLight) {
                // Response arrived (handler set _responseReceived and _remoteTemperature)
                // _waitingForTemperature should already be false from the handler
                return _remoteLight;
            }
            // Pause briefly to allow background tasks (like radio receive) to run
            basic.pause(20);
        }

        // If loop finishes without _responseReceived being true, it's a timeout
        _waitingForLight = false; // Ensure we are no longer waiting
        // serial.writeLine("Timeout waiting for remote temp"); // Optional debug message
        return -999; // Indicate timeout/failure
    }


    /**
    * Tomar el nivel de sonido desde una microbit externa
    */
    //% block="Nivel de sonido desde micro:bit externa"
    export function getSound(): number {
        // Reset state for this request
        _remoteSound = -999; // Default/error value
        _waitingForSound = true;
        _responseSound = false;

        // Send the request signal
        radio.sendString("Sou");

        // Wait for a response with a timeout
        const startTime = control.millis();
        const timeout = 1000; // 1000 ms = 1 second timeout

        while (control.millis() - startTime < timeout) {
            if (_responseSound) {
                // Response arrived (handler set _responseReceived and _remoteTemperature)
                // _waitingForTemperature should already be false from the handler
                return _remoteLight;
            }
            // Pause briefly to allow background tasks (like radio receive) to run
            basic.pause(20);
        }

        // If loop finishes without _responseReceived being true, it's a timeout
        _waitingForSound = false; // Ensure we are no longer waiting
        // serial.writeLine("Timeout waiting for remote temp"); // Optional debug message
        return -999; // Indicate timeout/failure
    }

    /**
    * Tomar la dirección de la brujula desde una microbit externa
    */
    //% block="Dirección de la brujula de micro:bit externa "
    export function getDirection(): number {
        // Reset state for this request
        _remoteDirection = -999; // Default/error value
        _waitingForDirection = true;
        _responseDirection = false;

        // Send the request signal
        radio.sendString("Dir");

        // Wait for a response with a timeout
        const startTime = control.millis();
        const timeout = 1000; // 1000 ms = 1 second timeout

        while (control.millis() - startTime < timeout) {
            if (_responseDirection) {
                // Response arrived (handler set _responseReceived and _remoteTemperature)
                // _waitingForTemperature should already be false from the handler
                return _remoteDirection;
            }
            // Pause briefly to allow background tasks (like radio receive) to run
            basic.pause(20);
        }

        // If loop finishes without _responseReceived being true, it's a timeout
        _waitingForDirection = false; // Ensure we are no longer waiting
        // serial.writeLine("Timeout waiting for remote temp"); // Optional debug message
        return -999; // Indicate timeout/failure
    }

    /**
    * Usar sensores externos de micro:bit
    */
    //% block="Usar sensores de micro:bit externa $channel"
    //% channel.min=1 channel.max=255
    export function ExternalSensors(channel: number) {
        radio.setGroup(channel);
        /**radio.onReceivedValue(function (name, value) {
            if (name == "Tem") {
                temFlag = true;
                temValue = value;
             } else if (name == "Lig") {
                ligFlag = true;
                ligValue = value;
            } else if (name == "Dir") {
                dirFlag = true;
                dirValue = value;
            } else if (name == "Sou") {
                ligFlag = true;
                dirValue = value;
            }
        });*/

        radio.onReceivedValue(function (tag, value) {
            if (_waitingForLight && tag == "Lig") {
                _remoteLight = value;
                _responseLight = true;
                _waitingForLight = false; // Stop waiting once received
            }
            if (_waitingForTemperature && tag == "Tem") {
                _remoteTemperature = value;
                _responseTemperature = true;
                _waitingForTemperature = false; // Stop waiting once received
            }
            if (_waitingForDirection && tag == "Dir") {
                _remoteDirection = value;
                _responseDirection = true;
                _waitingForDirection = false; // Stop waiting once received
            }
            if (_waitingForSound && tag == "Sou") {
                _remoteSound = value;
                _responseSound = true;
                _waitingForSound = false; // Stop waiting once received
            }
        })
    }

    /**
    * Ejecuta una acción cuando se recibe un gesto específico por radio.
    */
    //% block="Cuando la micro:bit externa sea $gesture"
    //% gesture.defl=Gesture.Shake
    //% channel.min=1 channel.max=255
    export function onGestureReceived(gesture: Gesture, handler: () => void): void {
        control.onEvent(4001, EventBusValue.MICROBIT_EVT_ANY, function () {
            let receivedGesture = control.eventValue();
            if (receivedGesture === gesture) {
                handler(); // Execute user-provided function if gesture matches
            }
        });
    }

    /**
    * Se elige un canal de radio por el cual mandarle los
    * datos que pida la micro:bit conectada a la UBit.
    */
    //% block="Compartir sensores con UBit $int"
    //% int.min=1 int.max=255
    export function shareSensorsWithUBit(int: number): void {
        radio.setGroup(int);
        
        radio.onReceivedString(function (msg: string) {
            handleMessage(msg);
        });

        control.onEvent(EventBusSource.MICROBIT_ID_GESTURE, EventBusValue.MICROBIT_EVT_ANY, function () {
            let gesture = control.eventValue();
            radio.raiseEvent(4001, gesture); // Send the gesture event over radio
        });
    }

}