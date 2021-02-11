---
layout: post
author: HTR
post-title: "DIY 433MHz ISM POCSAG Pager #3"
tags: AFU Arduino Funk Projekt Pager
---

Nach langer Zeit geht es mit dem Projekt wieder ein bisschen weiter. 
In diesem Post wird der SI4432 Chip genauer untersucht und versucht ihn als 
ASK-Sender zu konfigurieren. Um ihn dann schlussendlich als 
Sende- und Empfangschip für den Pager verwenden zu können.

# Vorweg: 
Die Nachrichten werden nicht mit dem eingebauten Buffer versendet, 
da dieser Buffer zu klein ist um sinnvoll POCSAG Nachrichten empfangen und 
senden zu können. Weiters ist auch das Packet-Handling nicht wirklich geeignet 
für POCSAG. Eine ausführlichere erläuterung ist weiter unten im Post zu finden.


# Ziele:
* Booten
* Reset
* Frequenz
* Deviation (Shift)
* Datenrate
* Modulationstyp
* Modulationdata Source
* Senden (direct mode)
* Daten empfangen (direct mode) (falls Sender vorhanden)
* power level
* AFC

<br>

# Booten

Es gibt 4 verschiedene Zustände:
* Shutdown
* IDLE
* TX State
* RX State

Weiters hat der IDLE state 5 Unterzustände:
* Standby Mode
* Sleep Mode
* Sensor Mode
* Ready Mode 
* Tune Mode

Bevor in einem Register ein Mode geschreiben wird, können wir zuerst aus dem "Device Status "Register (02h) auslesen in welchen Zustand wir und befinden.
Die ersten 2 Bits (cps) zeigen an in welchen Status sich das gerät befindet.

* 00 = Idle
* 01 = RX
* 10 = TX

Achtung! Reset value des Registers ist nicht definiert. Jedoch sollte cps gesetzt sein.

Nun können wir ein kleines Programm schreiben das testet in welchem Zustand sich der Chip befindet.

```c
void printDeviceStatusRegister(){
  Serial.print(read(0x02), BIN);
  Serial.println("");
}
```

Ergebnis = 1111111111111111

Wie wir erkennen hat und der SPI nichts sinvolles geliefert. Dies liegt daran das der SPI-Bus in Shutdown-Zustand deaktiviert ist.
Um nun den Shutdown-Zustand zu verlassen (SDN == HIGH -> Shutdown-State)
und den IDLE Zustand zu betretten wird der SDN auf LOW gezogen.
Danach wird wieder mit den Code von oben überprüft in welchem Zustand wir uns befinden.

Ergebnis = 0 (= 00000000)

Somit erkennen wir das sich der Chip momentan in dem IDLE Zustand befindet.

Um nun den Modus des IDLE Zustand zu wechseln kann das Register "Operating Mode and Function Control 1" (07h) verwendet werden.

Dieses lesen wir zuert einmal aus um zu sehen, wie es momentan konfiguriert ist. Laut Datenblatt sollte der Reset-Wert = 00000001 sein.

```c
void printOperatingModeandFunctionControl1(){
  Serial.print(read(0x07), BIN);
  Serial.println("");
}
```

Ergebnis = 1 (= 00000001)

Somit befinden wir uns laut Datenblatt im IDLE Ready Mode.
Nun versuchen wir den Chip in den Standby Mode zusetzten indem wir in das
07h Register 0h schreiben.

```c
void setIdleStandby(){
  write(0x07, 0x0);
}
```

Nach erneutem auslesen des Registers steht nun der Wert 0h drinnen und der Chip befindet sich somit in IDLE Standby-Mode.

Somit wurde der Chip erfolgreich zum Booten gebracht.

<br>

# Reset

Als nächstes kümmern wir uns um den Software-Reset. Dieser kann getriggert werden indem in das Register 07h "Operating Mode and Function Control 1" auf das 8. Bit eine 1 gschrieben wird.

```c
void reset(){
  write(0x07, 0b10000000);
}
```
Ob der Reset Funktioniert hat kann mithilfe der vorherigen Funktionen getestet werden. Zuerst wird der Chip in den Standby Modus versetzt und danach wird ein Reset getriggert. Nun sollte der Wert des 07h Registers wieder 1 (= 00000001) sein und das ist er auch.

Es würde auch noch expliziete Resets/Clears für den TX-FIFO und RX-FIFO im Register 08h "Operating Mode and Function Control 2" geben, jedoch werden diese momentan nicht benötigt.

<br>

# Frequenz

Um die Frequen einstellen zu können benötigt man 3 Register:
* Frequency Band Select
* Nominal Carrier Frequency 1
* Nominal Carrier Frequency 0

Die beiden unteren Register sind nur dafür da den Wert für die Nominal Carrier Frequency zu speichern, da der Wert 16 Bit groß ist Register nur 8 Bit speichern.
Das erste Register ("Frequency Band Select") beinhaltet 3 Attribute.
Die ersten 5 Bits [0..4] beinhalten den Wert für das Band, das Bit 5
beschreiben ob es sich um ein "high band" handelt oder nicht und das Bit 6 gibt
das siteband and 1 = "low-side injection" (bevorzugt) und 0 = "high-side injection"

Ein "high band" ist jede Frequenz die größer als 479.9 MHz ist.
Also muss das bit 1 sein wenn die Frequenz größer als 479.9Mhz ist, ansonsten
0.

Es ist auch wichtig beim programmieren der Frequenzen die Grenzen zu beachten.
* Min Freq (Band): 240 MHz
* Max Freq (Band): 930 Mhz

Was das bit für das Siteband macht wird im Datenblatt nicht beschrieben, aber laut diversen Github code sollte die immer 1 sein. 

Nun können wir uns mit einer kleinen Formel den fb Register Wert ausrechnen.

```
double fb_f = (freq / (10.0 * (hbsel + 1))) - 24
int fb = (int) fb
```
Achtung: Bei fb_f muss es sich in dem Fall um eine Kommazahl handeln, da wir die Kommastellen noch brauchen für das fc Register.
(Info: hbsel kann mit einem If-Statement ermittelt werden (< 480 Mhz))

Nun haben wir die Werte für fb und hbsel und sbsel (= 1) und somit sind
alle Werte für das "Frequency Band Select" Register vorhanden.

```
fbsr = (sbsel << 6) | (hbsel << 5) | fb
```

Als nächstes müssen die Werte für den Nominal Carrier ermittelt werden.
Diese Werte definieren welche genaue Frequenz dann in ausgewählten Band 
verwendet wird. Um diese Wert zu bestimmen kann folgende Formel verwendet
werden.

```
fc = (int) ((fb_f - fb) * 64000);
```

(fb_f - fb) liefert nur die Kommmazahlen.
Dieser 16 Bit große Werte kann dann die die 2 Register geladen werden, 
wobei im Register "Nominal Carrier Frequency 1" die 8 MSB stehen und in
Register "Nominal Carrier Frequency 0" die 8 LSB.

Somit wurden alle Register bestimmt.

```c
//freq in Mhz (5Mhz = 5.0)
void setFrequency(double freq){
  
  uint8_t hbsel;
  double fb_f;
  uint8_t fb;
  uint16_t fc;

  if(freq < 240 or freq > 930){
    Serial.println("Freq out of bounds");
    return;
  }

  if (freq < 480){
    hbsel = 0;
  }else{
    hbsel = 1;
  }

  //calculate the value for the fb register with float
  fb_f = (freq / (10 * (hbsel + 1))) - 24;

  //just hte value for the fb register (remove the fractional part)
  fb = ((uint8_t) fb_f) & 0b11111;

  //calculat the fractional component
  fc = (uint16_t) ((fb_f - fb) * 64000);

  //write to the register 0x75 frequency band select 
  //(bit 5 = hbsel (highband select) and the lower are the fb (frequency band))
  //bit 6 is the siteband select and the recommended value is 1 so that the rx
  //frequency is below (low-side injection)
  write(0x75, 0b1 << 6 | hbsel << 5 | fb);


  //write the upper 8 bit for the fc to the "Nominal Carrier Frequency 1"
  //register
  write(0x76, fc >> 8);

  //write the lower 8 bit for the fc  to the "Nominal Carrier Frequency 0"
  write(0x77, fc & 0xFF);

}
```

Durch dieses Verfahren enstehen Rundungsfehler und diese sind unteranderem durch
die Auflösung der Frequenz vom Chip gegeben. Um Schluss endlich zu überprüft 
welche Frequenz gespeichert worden ist, oder um einfach auszulesen welche Frequenz gespeichert ist kann folgende Funktion verwendet werden.

```c
void printFrequency(){

  uint8_t fbsr = read(0x75);

  uint8_t hbsel = (fbsr >> 5) && 0b1;
  uint8_t fb = fbsr & 0b11111;

  uint8_t fc_higher = read(0x76);
  uint8_t fc_lower = read(0x77);

  uint16_t fc = (fc_higher << 8) | fc_lower;

  double freq = 10.0 * (hbsel + 1) * (fb + 24 + fc / 64000.0);

  Serial.print("Stored Frequency: ");
  Serial.println(freq, DEC);
}
```

Die Formel für diese Berechnung ist auch im Datenblatt zu finden.

INFO: Ich würde nicht empfehlen die Formel aus den Datenblatt zu verwenden für
die berechnung des fc Wertes, da diese "falsche" Werte liefert, weiters bin ich
mir nicht sicher ob das XLS Dokument von Silicon Labs geignet ist für die 
überprüfung. Ich habe mir diverse SI4432 Projekte auf Github angesehen und 
diese alle verwenden die oben angeführte Berechnungsmethode, welche in meinen 
Augen auch sehr sinnvoll erscheint.
Sollte ich mich geirrt haben freue ich mich auf Feedback.

<br>

# Deviation (Shift)

Der SI4432 unterstützt einen Shift / eine Deviation von +-1 bis +-320 kHz und kann in Schritten von 625 Hz eingestellt werden. (Auflösung = 625Hz per Inkrement).
Bei Frequenz Modulation ändert sich dann die Frequenz um +- des Shifts.

Der Deviation / Shift Register Wert lässt sich wie folgt errechnen:
```
fd = shift / 625 
```

Der fd Wert kann dann ins Register 72h geschrieben werden.

```c
//deviation in khz  (50kHz = 50)
void setDeviation(double deviation){

  if(deviation < 1 || deviation >= 320){
    Serial.println("Deviation out of bounds");
  }

  uint8_t fd = round(deviation / 0.625);

  write(0x72, fd);
}
```
<br>

Diese Berrechnung liefert teilweise einige merkwürde Zahlen. Jedoch stimmen
sie mit dem XLS Dokument von Silicon-Labs überein.

# Datenrate 

Die Datenrate ist konfigurierbar zwischen 1 - 128 kbps.
Achtung wenn die Datenrate unter 30 kbps liegt muss "txdtrtscale" im Register
70h auf 1 gesetzt werden andernfalls 0.

Die Datenrate lässt sich wie folgt errechnen.
```
if rate < 30
    scale = 2097152
else
    scale = 65536.0

txdr = round(rate * scale / 1000.0)
```

Achtung: Hier wird wieder eine andere Formel verwende als wie in Datenblatt
angeführt, da die Formel im Datenblatt zu Ergebnissen führt die keinen Sinn machen. Die jetzt verwendete Formel stammt aus einem Github Projekt und stimmt
auch mit den Werten der XLS Datei von Silicon Labs überein.

Bei der Datenrate die wir erhalten handelt es sich um eine 16 Bit Zahl und diese wird wieder in 2 Registern abgespeichert.
* TX Data Rate 1 (obere 8 Bit (MSB)) (6eh)
* TX Data Rate 0 (untere 8 Bit (LSB)) (6fh)

```c
//datarate in kbps (3kbps = 3)
void setDataRate(double datarate){

  uint8_t txdtrtscale;
  double scale;
  uint8_t txdr;

  if (datarate < 30){
    txdtrtscale = 1;
    scale = 2097152.0;
  }else{
    txdtrtscale = 0;
    scale = 65536.0;
  }
  
  txdr = round(datarate * scale / 1000.0);

  //write the new datarate
  write(0x6E, txdr >> 8);
  write(0x6F, txdr & 0xFF);

  //update the txdtrtscale bit in the register 70h
  write(0x70, (read(0x70) & 0b11011111) ^ (txdtrtscale << 5));
}
```

<br>

# Modulationstyp

Als nächstes wird versucht den Modulationstypen einzustellen.
Der SI4432 Chip untersützt grundsätzlich 4 verschiedene Modulationsarten: 
* Unmodulated Carrier (0b00)
* OOK On-Off-Keying (0b01)
* FSK Frequency-Shift-Keying (0b10)
* GFSK Gaussian-Frequency-Shift-Keying (0b11)

Diese Wert kann im Register 71h "Modulation Mode Control 2" festgeschrieben werden.

```c
#define UnmodulatedCarrier 0b00
#define OOK 0b01
#define FSK 0b10
#define GFSK 0b11

void setModulationType(uint8_t typ){

  if(typ > 3){
    Serial.println("Invalid Mod Type")
  }

  //update the first 2 fields / bits (modtyp)
  write(0x71, (read(0x71) & 0b11) | type);
}
```

<br>

# Modulationdata Source
