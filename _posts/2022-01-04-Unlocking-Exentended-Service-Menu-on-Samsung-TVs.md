---
layout: post
author: HTR
post-title: "Unlocking Exentended Service Menu on Samsung TVs"
tags: Arduino Hacking
---

Vor ein paar Tagen wollte ich auf einem Samsung TV einen Film aufnehmen, nur funktionierte dies leider nicht, da die Aufnahmefunktion gesperrt war. Nach kurze Web-Suche fand ich heraus das diese Funktion über das Extended Service Menü aktiviert werden kann.

<br>

# Extended Service Menü öffnen

Um das Extended Service Menü zu öffnen benötigt man eine bestimmte Tastenkombination.
Diese war bei meinem TV wie folgt:

1. TV muss ausgeschalten sein (Standby)
2. INFO - MENU - MUTE - POWER (Tasten nacheinander drücken)

Nun sollte sich der TV einschalten und das Extended Service Menu sichtbar sein.

Dieses Menu sieht wie im folgenden Bild aus:

BILD HIER EINFÜGEN

Sollte dieses Menü nicht aufscheinen, muss eine andere Tastenkombination verwendet werden. Diese Kombinationen sind relativ leicht im Internet auffindbar.

<br>

# Extended Service Menü Entsperren

Bei meinem Extended Service Menü hat es sich leider um eine gesperrte Variante des Service Menüs gehandelt.
Dies ist gut erkannbar, da ein haufen Menüpunkte fehlen.

HIER BSP EINFÜGEN VON MENÜ DAS 3 SEITEN LANG SEIN SOLLTE ABER NUR EINE HATTE

Um dieses Menü weiter zu entsperren muss auf der Fernbedinung die Tasten "3SPEED" und "FACTORY" gedrückt werden. Jedoch existierten diese Tasten auf meiner Fernbedinung nicht, daher habe ich ein Arduino Programm geschrieben, das mithilfe einer IR Led diese Tastendrücke emuliert.

<br>

# Arduino Code

```c
#include <Arduino.h>
#include <IRremote.hpp>

#define DECODE_SAMSUNG

uint8_t IR_SEND_PIN = 11;

void setup() {

    IrSender.begin(IR_SEND_PIN);

    int wait_time = 505;

    //sequence to enter the extended service menu
    IrSender.sendSamsung(0x707, 31, 0); //INFO
    delay(wait_time);
    IrSender.sendSamsung(0x707, 26, 0); //MENU
    delay(wait_time);
    IrSender.sendSamsung(0x707, 15, 0); //MUTE
    delay(wait_time);
    IrSender.sendSamsung(0x707, 2, 0); //POWER

    //wait for the TV to boot
    delay(wait_time * 20)

    //unlock the extended service menu
    IrSender.sendSamsung(0x707, 59, 0); //FACTORY
    delay(wait_time);
    IrSender.sendSamsung(0x707, 60, 0); //3 SPEED

}

void loop() {
}
```

<br>

# Aufnahmefunktion aktivieren

TODO look this up?


<br>

# Debugging

Oft ist es nicht so leicht zu überprüfen ob das System funktionert, oder ob der Controller die richtigen Daten aussendet. Eine nette Lösung um die ausgesendeten Daten zu verifizieren oder Daten von der Fernbedinung abgreifen ist es einen IR empfänger zu bauen. Hierfür kann folgender Code verwedet werden.

```c
#include <Arduino.h>
#include <IRremote.hpp>

#define DECODE_SAMSUNG

uint8_t IR_RECV_PIN = 12;

void setup() {
  Serial.begin(115200);
  IrReceiver.begin(IR_RECV_PIN);
}

void loop() {
   if (IrReceiver.decode()) {
        // Print a short summary of received data
        IrReceiver.printIRResultShort(&Serial);
        if (IrReceiver.decodedIRData.protocol == UNKNOWN) {
            // We have an unknown protocol here, print more info
            IrReceiver.printIRResultRawFormatted(&Serial, true);
        }
        Serial.println();

        IrReceiver.resume(); // Enable receiving of the next value
   }
}

```
