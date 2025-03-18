
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

//Transforma el string a buffer, lo rellena y lo manda a la UBit
function sendNumBuffer(message: string) {
    // Ensure the message does not exceed BUFF_LEN - 1 to make space for '%'
    if (message.length > BUFF_LEN - 1) {
        message = message.slice(0, BUFF_LEN - 1);
    }

    // Add '&' at the start and shift the message
    message = "&" + message + "&";

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




/**
 * Custom blocks
 */
//% weight=100 color=#c845da icon="\uf29a"
namespace UBit {

    /**
     * Reproduce el texto o número por audio en la UBit y lo muestra en la pantalla.
     */
    //% block="Mostrar cadena $text con audio"
    //% text.shadowOptions.toString=true
    export function RepTextwithScreen(text: any) {
        let textString = text.toString(); // Convierte cualquier entrada a cadena
        StopI2CScreen = 1;
        sendTextBuffer(textString);
        basic.showString(textString);
        StopI2CScreen = 0;
    }



    /**
    * Reproduce el texto escrito por audio en la UBit.
    */
    //% block="Reproducir $text por audio"
    export function RepText(text: string) {
        StopI2CScreen = 1
        sendTextBuffer(text)
        StopI2CScreen = 0
    }

    /*ME QUEDE ACAAAAAAAAAAAA , HAY QUE TESTEAR PARA ABAJO

    /**
    * Reproduce el número escrito por audio en la UBit.
    */
    //% block="Reproducir $num por audio"
    export function RepNum(num: number) {
        let textString = num.toString(); // Convierte cualquier entrada a cadena
        StopI2CScreen = 1
        if(num>=0 && num<=9){
            sendNumBuffer(textString)
        } else if (num>9){
            sendTextBuffer(textString)
        }
        StopI2CScreen = 0
    }

    /**
    * Reproduce el número escrito por audio en la UBit y muestra en pantalla.
    */
    //% block="Mostrar en pantalla $num y reproducir por audio"
    export function RepNumwithScreen(num: number) {
        let textString = num.toString(); // Convierte cualquier entrada a cadena
        StopI2CScreen = 1
        if (num >= 0 && num <= 9) {
            sendNumBuffer(textString)
        } else if (num > 9) {
            StopI2CScreen = 1
            sendTextBuffer(textString)
            StopI2CScreen = 0
        }
        basic.showNumber(num);
    }

    /**
    * Conecta la UBit a la red deseada. 
    * En caso de no usar este bloque se conectara a la red de Ceibal.
    */
    //% block="Conectarse a la red $WiFi con la contraseña $Pssw"
    export function ConWiFi(WiFi: string, Pssw: string) {
        StopI2CScreen=1
        sendWiFiBuffer(WiFi, Pssw)
        StopI2CScreen = 0
        str = ""
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
    * Se escoge un sensor (y otro párametro de ser necesario) 
    * y un canal de radio por el cual pedir los datos.
    */
    //% block="Utilizar el sensor de $yes por el canal $int, dimension $x y rotacion $y"
    export function ActSen(yes: Sensor, int: number, x: Dimension, y: Rotation) {
        radio.setGroup(int)
        switch(yes){
            case (0):{
                radio.sendString("Temp")
                control.waitMicros(200)
                break;
            } case (1): {
                radio.sendString("Luz")
                control.waitMicros(200)
                break;
            } case (2): {
                radio.sendString("Sonido")
                control.waitMicros(200)
                break;
            } case (3): {
                switch(x){
                    case(0):{
                        radio.sendString("Accelx")
                        control.waitMicros(200)
                        break;
                    } case (1): {
                        radio.sendString("Accely")
                        control.waitMicros(200)
                        break;
                    } case (2): {
                        radio.sendString("Accelz")
                        control.waitMicros(200)
                        break;
                    } case (3): {
                        radio.sendString("AccelF")
                        control.waitMicros(200)
                        break;
                    }
                }
                break;
            } case (4): {
                radio.sendString("Bru")
                control.waitMicros(200)
                break;
            } case (5): {
                switch (y) {
                    case (0): {
                        radio.sendString("Rot0")
                        control.waitMicros(200)
                        break;
                    } case (1): {
                        radio.sendString("Rot1")
                        control.waitMicros(200)
                        break;
                    }
                }    
                break;
            } case (6): {
                radio.sendString("Time")
                control.waitMicros(200)
                break;
            } case (7): {
                switch (x) {
                    case (0): {
                        radio.sendString("FMagx")
                        control.waitMicros(200)
                        break;
                    } case (1): {
                        radio.sendString("FMagy")
                        control.waitMicros(200)
                        break;
                    } case (2): {
                        radio.sendString("FMagz")
                        control.waitMicros(200)
                        break;
                    } case (3): {
                        radio.sendString("FMagF")
                        control.waitMicros(200)
                        break;
                    }
                }
                break;
            }
        }

    }

    /**
    * Se escogen todos los sensores disponibles 
    * y un canal de radio por el cual pedir los datos.
    */
    //% block="Utilizar todos los sensores externos en el canal $int"
    export function ActAllSenExt(int: number) {
        radio.setGroup(int)
        radio.sendString("All")
        control.waitMicros(200)
    }

    /**
    * Se elige un canal de radio por el cual mandarle los 
    * datos que pida la micro:bit conectada a la UBit.
    */
    //% block="Enviar datos de sensores por el canal $int a la UBit"
    export function SendAllSenInt(int: number) {
        radio.setGroup(int)
        radio.onReceivedString(function (receivedString) {
            switch(receivedString){
                case ("Temp"):{
                    radio.sendValue("Temp", input.temperature())
                    basic.showLeds(`
                    . . . . .
                    # # # # #
                    . . # . .
                    . . # . .
                    . . # . .
                    `)
                    break;
                } case ("Luz"): {
                    radio.sendValue("Luz", input.temperature())
                    basic.showLeds(`
                    . . . . .
                    . # . . .
                    . # . . .
                    . # . . .
                    . # # # .
                    `)
                    break;
                } case ("Sonido"):{
                    radio.sendValue("Sonido", input.lightLevel())
                    basic.showLeds(`
                    . # # # #
                    # . . . .
                    . # # # .
                    . . . . #
                    # # # # #
                    `)
                    break;
                } case ("Accelx"): {
                    radio.sendValue("Accel", input.acceleration(0))
                    basic.showLeds(`
                    . # # # .
                    . # . # .
                    . # # # .
                    . # . # .
                    . # . # .
                    `)
                    break;
                } case ("Accely"): {
                    radio.sendValue("Accel", input.acceleration(1))
                    basic.showLeds(`
                    . # # # .
                    . # . # .
                    . # # # .
                    . # . # .
                    . # . # .
                    `)
                    break;
                } case ("Accelz"): {
                    radio.sendValue("Accel", input.acceleration(2))
                    basic.showLeds(`
                    . # # # .
                    . # . # .
                    . # # # .
                    . # . # .
                    . # . # .
                    `)
                    break;
                } case ("AccelF"): {
                    radio.sendValue("Accel", input.acceleration(3))
                    basic.showLeds(`
                    . # # # .
                    . # . # .
                    . # # # .
                    . # . # .
                    . # . # .
                    `)
                } case ("Bru"): {
                    radio.sendValue("Bru", input.compassHeading())
                    basic.showLeds(`
                    . # . . .
                    . # . . .
                    . # # # .
                    . # . # .
                    . # # # .
                    `)
                    break;
                } case ("Rot0"): {
                    radio.sendValue("Rot", input.rotation(0))
                    basic.showLeds(`
                    . # # # .
                    . # . # .
                    . # # # .
                    . # # . .
                    . # . # .
                    `)
                    break;
                } case ("Rot1"): {
                    radio.sendValue("Rot", input.rotation(1))
                    basic.showLeds(`
                    . # # # .
                    . # . # .
                    . # # # .
                    . # # . .
                    . # . # .
                    `)
                    break;
                } case ("Time"): {
                    radio.sendValue("Time", input.runningTime())
                    basic.showLeds(`
                    . . . . .
                    . # . . .
                    # # # . .
                    . # . . .
                    . # # # .
                    `)
                    break;
                } case ("FMagx"): {
                    radio.sendValue("FMag", input.magneticForce(0))
                    basic.showLeds(`
                    . # # # .
                    . # . . .
                    . # # # .
                    . # . . .
                    . # . . .
                    `)
                    break;
                } case ("FMagy"): {
                    radio.sendValue("FMag", input.magneticForce(1))
                    basic.showLeds(`
                    . # # # .
                    . # . . .
                    . # # # .
                    . # . . .
                    . # . . .
                    `)
                    break;
                } case ("FMagz"): {
                    radio.sendValue("FMag", input.magneticForce(2))
                    basic.showLeds(`
                    . # # # .
                    . # . . .
                    . # # # .
                    . # . . .
                    . # . . .
                    `)
                    break;
                } case ("FMagF"): {
                    radio.sendValue("FMag", input.magneticForce(3))
                    basic.showLeds(`
                    . # # # .
                    . # . . .
                    . # # # .
                    . # . . .
                    . # . . .
                    `)
                    break;
                } case ("All"): {
                    radio.sendValue("Temp", input.temperature())
                    control.waitMicros(200)
                    radio.sendValue("Luz", input.temperature())
                    control.waitMicros(200)
                    radio.sendValue("Sonido", input.lightLevel())
                    control.waitMicros(200)
                    radio.sendValue("Accel", input.acceleration(0))
                    control.waitMicros(200)
                    radio.sendValue("Accel", input.acceleration(1))
                    control.waitMicros(200)
                    radio.sendValue("Accel", input.acceleration(2))
                    control.waitMicros(200)
                    radio.sendValue("Accel", input.acceleration(3))
                    control.waitMicros(200)
                    radio.sendValue("Bru", input.compassHeading())
                    control.waitMicros(200)
                    radio.sendValue("Rot", input.rotation(0))
                    control.waitMicros(200)
                    radio.sendValue("Rot", input.rotation(1))
                    control.waitMicros(200)
                    radio.sendValue("Time", input.runningTime())
                    control.waitMicros(200)
                    radio.sendValue("FMag", input.magneticForce(0))
                    control.waitMicros(200)
                    radio.sendValue("FMag", input.magneticForce(1))
                    control.waitMicros(200)
                    radio.sendValue("FMag", input.magneticForce(2))
                    control.waitMicros(200)
                    radio.sendValue("FMag", input.magneticForce(3))
                    basic.showLeds(`
                    # # # # #
                    # # # # #
                    # # # # #
                    # # # # #
                    # # # # #
                    `)
                    break;
                }
            }
        })    
    }

}
