
/**
* Utilice este archivo para definir funciones y bloques personalizados.
* Lea más en https://makecode.microbit.org/blocks/custom
*/
let waitTime = 1000;  // 5000 milliseconds = 5 seconds

// Stores the last received number
let lastReceivedNumber = 0;

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
        basic.showNumber(1)
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

// Function to handle different messages
function handleMessage(msg: number): void {
    if (msg == 1) {
        radio.sendString("Hello!");
    } else if (msg == 2) {
        radio.sendValue("temperature", input.temperature());
    } else if (msg == 3) {
        radio.sendValue("light", input.lightLevel());
    } else if (msg == 4) {
        radio.sendValue("sound", input.soundLevel());
    } else if (msg == 5) {
        radio.sendString("Custom message received");
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
        let startTime = input.runningTime();  // Get the current time in milliseconds
        let temperature: number = -1; // Default value indicating no data received

        radio.sendString("Tem");

        // Wait for the temperature to be received
        while (input.runningTime() - startTime < waitTime) {
            if (ligFlag) {
                temperature = temValue
                ligFlag = false;
                return temperature;
            }
        }

        return -1;
    }

    /**
 * Tomar el nivel de luz desde una microbit externa
 */
    //% block="Nivel de luz desde micro:bit externa"
    export function getLight(): number {
        let startTime = input.runningTime();  // Get the current time in milliseconds
        let light: number = -1; // Default value indicating no data received

        radio.sendString("Lig");

        // Wait for the temperature to be received
        while (input.runningTime() - startTime < waitTime) {
            if (ligFlag) {
                light = ligValue
                ligFlag = false;
                return light;
            }
        }

        return -1;
    }

    /**
    * Tomar el nivel de sonido desde una microbit externa
    */
    //% block="Nivel de sonido desde micro:bit externa"
    export function getSound(): number {
        let sound: number = -1; // Default value indicating no data received
        let startTime = input.runningTime();  // Get the current time in milliseconds

        radio.sendString("Sou");

        // Wait for the temperature to be received
        while (input.runningTime() - startTime < waitTime) {
            if (souFlag) {
                sound = ligValue
                souFlag = false;
                return sound;
            }
        }

        return -1;
    }

    /**
    * Tomar la dirección de la brujula desde una microbit externa
    */
    //% block="Dirección de la brujula de micro:bit externa "
    export function getDirection(): number {
        let direction: number = -1; // Default value indicating no data received
        let startTime = input.runningTime();  // Get the current time in milliseconds

        radio.sendString("Dir");

        // Wait for the temperature to be received
        while (input.runningTime() - startTime < waitTime) {
            if (dirFlag) {
                direction = dirValue
                dirFlag = false;
                return direction;
            }
        }

        return -1;
    }

    /**
    * Detecta si el micro:bit está realizando un gesto y ejecuta una acción.
    */
    //% block="si $gesture en micro:bit externa"
    export function onGestureDetect(gesture: Gesture, handler: () => void): void {
        radio.onReceivedValue(function (name: string, value: Gesture) {
            if (name == "Ges") {
                if (value == gesture) { 
                    handler(); // Ejecuta la acción
                }
            }
        });
    }

    /**
    * Usar sensores externos de micro:bit
    */
    //% block="Usar sensores de micro:bit externa $channel"
    //% channel.min=1 channel.max=255
    export function ExternalSensors(channel: number) {
        radio.setGroup(channel);
        radio.onReceivedValue(function (name, value) {
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
        });
    }

    /**
     * Se elige un canal de radio por el cual mandarle los
     * datos que pida la micro:bit conectada a la UBit.
     */
    //% block="Enviar datos a UBit $int"
    //% int.min=1 int.max=255
    export function startRadioListener(int: number): void {
        radio.setGroup(int);
        control.inBackground(function () {
            while (true) {
                let msg = radio.receiveNumber();
                if (!isNaN(msg)) {
                    lastReceivedNumber = msg;
                    handleMessage(msg)
                }
                basic.pause(50); // Prevents crashing by adding a delay
            }       
            // Register a single event handler for gesture detection
            control.onEvent(EventBusSource.MICROBIT_ID_GESTURE, EventBusValue.MICROBIT_EVT_ANY, function () {
                let gesture = control.eventValue();
                radio.raiseEvent(4001, gesture); // Send the gesture event over radio
            });
        });
    }

}