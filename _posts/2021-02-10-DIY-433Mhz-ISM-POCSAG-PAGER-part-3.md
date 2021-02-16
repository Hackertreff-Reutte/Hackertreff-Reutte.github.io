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
* Direct Mode
* Senden (direct mode)
* Frequenz Offset
* Packet Handler ausschalten
* Preamble
* SYNC Wort
* RX Modem
* Empfangen (direct mode)
* Quarz / Frequenz tuning
* Sende-Leistung
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

  uint8_t hbsel = (fbsr >> 5) & 0b1;
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

Die Datenrate ist konfigurierbar zwischen 1 - 128 kbps / 0.123 - 256 kbps.
(Je nach Datenblatt)
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
  uint16_t txdr;

  if(datarate < 1 || datarate > 128){
    Serial.print("Datarate out of bounds");
    return;
  }

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

Info für Direct Mode:

Wenn der Direct Mode verwendet (zb mit FSK), dann ist diese Einstellung relativ
sinnlos, da die Datenrate über die Geschwindigkeit der übertragenden Daten 
festgelegt wird. Folglich sollten die Daten auch ununterbrochen übertragen
werden, da es sonst zu verschiedenen Datenraten kommen kann (Wichtig bei zB.
SPI)


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
    Serial.println("Invalid Mod Type");
    return;
  }

  //update the first 2 fields / bits (modtyp)
  write(0x71, (read(0x71) & 0b11111100) | typ);
}
```

<br>

# Modulationdata Source

Der SI4432 unterstützt verschiedene Methoden um Sende-Daten an den Chip zu
übertragen.
* Direct Mode mit TX_Data via GPIO pin (0b00)
* Direct Mode mit TX_Data via SDI pin (nur wenn nSEL HIGH ist) (0b01)
* FIFO Mode (0b10)
* PN9 (internally generated) (0b11)

Achtung: für Direct Mode mit GPIO muss der Pin auch noch konfiguriert werden.
Weiters muss auch definiert werden welche Clock verwendet wird. (See Direct Mode)

Der Wert für die Modulationsdatenquelle muss ins Register 71h geschrieben werden. (dtmod)

```c
#define SOURCE_DIRECT_GPIO 0b00
#define SOURCE_DIRECt_SPI 0b01
#define SOURCE_FIFO 0b10
#define SOURCE_PN9 0b11

void setModulationDataSource(uint8_t source){

  if(source > 3){
    Serial.println("Invalid Data Source");
    return;
  }

  //update the value
  write(0x71, (read(0x71) & 0b11001111) | (source << 4));

}
```

<br>

# Direct Mode

Wenn der Direct Mode verwendet wird muss noch definiert über welchen Pin die
Clock übertragen wird. Dies wird in dem Register "Modulation Mode Control 2"
(71h) festgelegt und es gibt folgende Möglichkeiten.

* No TX Data CLK (0b00)
* TX Data CLK is available via the GPIO pin (0b01)
* TX Data CLK is available via the SDO pin (0b10)
* TX Data CLK is available via the nIRQ pin (0b11)

Da wir eine FSK verwenden wollen braucht es keinen extra Clock Pin.

```c
#define NO_TX_DATA_CLK 0b00
#define TX_CLK_GPIO 0b01
#define TX_CLK_SDO 0b10
#define TX_CLK_nIRQ 0b11

void setDirectClockSource(uint8_t source){

  if(source > 3){
    Serial.println("Invalid Clock Source");
  }

  write(0x71, (read(0x71) & 0b00111111) | (source << 6));  
}
```
163.175
<br>

# Senden (direct mode)

Achtung: Hierbei wird der SPI des ESP32 im DMA Modus verwendet.

Nun haben wir alle Funktionen um Signale zu senden. Jedoch benötigen wir noch Programme mit denen wir uns POCSAG Nachrichten erstellen können.

Hierfür verwende ich ein kleines Python Programm:

```python
from pocsag import encodeTXBatch
msgs = []
# Format = [ IsNumeric, Address(also supports A,B,C,D suffix like "133703C"), Message ]
msgs.append([False, "1337", 'Test POCSAG 123'])
data = encodeTXBatch(msgs) #, repeatNum = 2, inverted = False


print (format(85,'08b'))

binData = [format(x, '08b') for x in data]


bit32Data = [ ''.join(x) for x in zip(binData[0::4], binData[1::4], binData[2::4], binData[3::4])]

for x in bit32Data:
    print ("tx_temp = add32Bit(tx_temp, 0b" + x + ");")

print ("Lines: " + str(len(bit32Data)) + "   Transfered Bits: " + str(len(bit32Data) * 32))
```

Wichtig ist es sich die Transfered Bits zu merken, da dies die Menge an Bits it die der SPI übertragen muss, da sonst nicht alle Daten übertragen wurden.

Das Modul das in diesem Script verwendet wird wurde von cuddlycheetah erstellt. 
Link zu der Github-Repo: <a href="https://github.com/cuddlycheetah/python-pocsag">Github</a>

Das Script erstellt eine Ausgabe welche direkt in das ESP32 Projekt kopiert
werden kann. Jedoch benötigt sie die add32Bit() Funktion. Diese ist
folgendermaßen aufgebaut.

```c
uint8_t * add32Bit(uint8_t* tx, uint32_t data){
    tx[0] = (data >> 24) & 0xFF;
    tx[1] = (data >> 16) & 0xFF;
    tx[2] = (data >> 8) & 0xFF;
    tx[3] = (data >> 0) & 0xFF;
    return tx + 4;
}
```

Somit haben wir nun das Payload das wir übertragen woll und müssen nur noch 
vorher den den Chip vorbereiten. (Frequenz setzen, Deviation usw.)


```c
    Serial.println("Setting Frequency");
    setFrequency(433);
    delay(100);
    Serial.println("Setting Deviation");
    setDeviation(4.5);
    delay(100);
    Serial.println("Setting Modulation");
    setModulationType(FSK);
    delay(100);
    Serial.println("Setting Modulation Source");
    setModulationDataSource(SOURCE_DIRECt_SPI);
    delay(100);
    Serial.println("Setting Modulation CLK Source");
    setDirectClockSource(NO_TX_DATA_CLK);
    delay(100);
    Serial.println("Enable TX MODE");
    setTXMode();
```
Info: Funktionen wurden in den vorherigen Kapiteln aufgeführt. Weiters gibt es zum Schluss Links zu den Source-files.

Die Datenrate muss nicht gesetzt werden, da diese durch die Geschwindigkeit,
des SPIs vorgegeben wird.
Kurzgesagt: Wenn das SPI die Daten mit 512bps übertragen werden dann werden 
sie auch mit 512kps gesendet. 

Diesen Modus nennt man auch Direct-Asynchronous-Mode. Diesem steht der 
Direct-Synchronous-Mode gegenüber, wo die Datenrate über eine eigene
Clock-Leitung vorgegeben wird.


Hier nochmal der komplette Sende-Vorgang  in einer Funktion:

```c
void sendData(){
  Serial.println("Setting Frequency");
    setFrequency(433);
    delay(100);
    Serial.println("Setting Deviation");
    setDeviation(4.5);
    delay(100);
    Serial.println("Setting Datarate");
    setDataRate(5);
    delay(100);
    Serial.println("Setting Modulation");
    setModulationType(FSK);
    delay(100);
    Serial.println("Setting Modulation Source");
    setModulationDataSource(SOURCE_DIRECt_SPI);
    delay(100);
    Serial.println("Setting Modulation CLK Source");
    setDirectClockSource(NO_TX_DATA_CLK);
    delay(100);
    Serial.println("Enable TX MODE");
    setTXMode();

    uint8_t * tx_temp = tx_buf;
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b01010101010101010101010101010101);
    tx_temp = add32Bit(tx_temp, 0b10000011001011011110101000100111);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b11111111111010110000001100001100);
    tx_temp = add32Bit(tx_temp, 0b01101010010110000110011111101011);
    tx_temp = add32Bit(tx_temp, 0b00110100011111011111011010011000);
    tx_temp = add32Bit(tx_temp, 0b01000001100011110001111010011000);
    tx_temp = add32Bit(tx_temp, 0b00100111110000111011101110000010);
    tx_temp = add32Bit(tx_temp, 0b01101011100110110010011000101001);
    tx_temp = add32Bit(tx_temp, 0b01100111111111111111110011010000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000011001011011110101000100111);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b11111111111010110000001100001100);
    tx_temp = add32Bit(tx_temp, 0b01101010010110000110011111101011);
    tx_temp = add32Bit(tx_temp, 0b00110100011111011111011010011000);
    tx_temp = add32Bit(tx_temp, 0b01000001100011110001111010011000);
    tx_temp = add32Bit(tx_temp, 0b00100111110000111011101110000010);
    tx_temp = add32Bit(tx_temp, 0b01101011100110110010011000101001);
    tx_temp = add32Bit(tx_temp, 0b01100111111111111111110011010000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
    tx_temp = add32Bit(tx_temp, 0b10000101011101100011111001101000);
  

    //DMA SPI (could change in the final release, but is not that hard to implement)
    spi.beginTransaction(HSPI, SPI_MODE0, 512);
    spi.transfer(2000, tx_buf, rx_buf); 
    spi.endTransaction();

    delay(100);

    Serial.println("Reset");
    reset();
}
```

Info: Die Transfergrößer des SPI ist auf 3000 gestellt was größer ist als die benötigten 1644. Dies ist nicht so ein großes Problem, nur kleiner sollte sie nicht sein.

<br>

# Frequenz Offset

Ein Problem beim Senden von Daten ist das die Sende-Frequenz nicht genau mit
der erwarteten Frequenz übereinstimmt. Dies ist wahrscheinlich auf die 
Ungenaugikeit des Chips zurückzugühren, da ich bei verschiedenen Chips 
verschiedene Frequenzen bei den gleichen Einstellungen erhalte.
Um nun dies für Testzwecke kompensieren zu können kann ein statischer Offset 
verwendet werden. Später sollte die durch den AFC (Automatic Frequency Control)
passieren. Jedoch muss dafür RX funktionieren, da sich der Chip darüber
synchronisiert.

Laut Datenblatt kann der Offset wie folgt berechnet werden:
```
fo = offset / (0.15625 * (hbsel + 1))
```
hbsel = high band select (siehe Register 75h)

Achtung: Meiner Erfahrung nach stimmt diese Formel nicht ganz, da sie nicht 
die erwarteten Ergebnisse liefert. (offset = 1 führt nicht zu 1kHz offset im 
Signal)

```c
//offset in khz
void setOffset(double offset){

  uint8_t fbsr = read(0x75);
  uint8_t hbsel = (fbsr >> 5) & 0b1;

  uint16_t fo = offset / (0.15625 * (hbsel + 1));

  write(0x73, fo & 0xFF);
  write(0x72, (fo >> 8) & 0b11);
}
```

<br>

# Packet Handler ausschalten

Der Packet Handler kann im Register 30h "Data Access Controll" aktiviert und 
deaktiviert werden. Für meinen Fall (POCSAG) muss ich den Packet-Handler 
ausschalten, da die POCSAG Packete viel zu groß für den FIFO sind 
(besonders wenn mehrere Frames ankommen) und die Synchronisation mit FSC 
(frame sync code) funktioniert auch nicht (SI4432: pro Packet 1 FSC / POCSAG
FSC nach jedem Frame (kein neus Packet)).

Laut Datenblatt wird das Register mit 10001101 initialisiert.
Wobei das Bit 7 (enpacrx) angibt, ob der Packet-Handler für RX aktiviert werden
soll oder nicht. 
Das Bit 3 (enpactx) ist für TX.

Laut Datenblatt müsste der Packethandler nicht deaktiviert werden, doch wird
er auch nicht benötigt von dem her sehe ich keinen Grund ihn nicht zu 
deaktivieren.

Info: Dieses Register kann gänzlich mit 0 überschrieben werden, da die anderen
Bits nur für die weitere Konfiguration des Packet-Handler da sind.

```c
void disablePacketHandler(){
  write(0x30, 0);
}
```

<br>

# Preamble

Für das einstellen der Preamble sind folgende Parameter von Bedeutung:
* Preamble Länge (Register 34h)
* Preamble Detection Threashold


Die Länge wird im Register 34h und 33h festgelegt.
Für die Berechnung kann folgende Formel verwendet werden:
```
prealen = preambleLänge / 4
```

Wenn die Länge des Preamble >= 256 ist, dann muss das Bit im Register
33h gesetzt werden (ist das MSB der Peramble Länge) (Länge der Peramble
wird in 9 Bits abgespeichert)


Es nächstes wird der Peramble Detection Threashold festgelegt.
Dieser besagt wie viele Bits von der Peramble gelesen werden müssen bevor sie
als gültig erkannt wird. Ein guter Wert dafür ist laut Datenblatt 20Bits.

Für die Berechnung kann folgende Formel verwendet werden:
```
preath = theashold / 4
```

```C
//length in bytes + threashld in bytes
void setPreamble(uint16_t length, uint16_t threashold){

  // byte = 8 bit
  // x = byte * 8 / 4 = byte * 2

  //bounds check
  if(length > 512 || threashold > 128){
    Serial.println("length or threashold out of bounds");
    return;
  }

  uint16_t lenNibbles = length * 2;
  uint8_t threasholdNibbles = threashold * 2;

  //writing the preamble length
  write(0x34, lenNibbles & 0xFF);
  write(0x33, (read(0x32) & 0b11111110) | ((lenNibbles >> 8) & 1));

  //writing the detection threashold
  write(0x35, (threasholdNibbles & 0b11111) << 3);
}
```

Nutzlich kann es sein das Invalid Preamble Register auszulesen, um zu erkennen
ob der Chip die Preamble erkannt hat. 
Der Invalid-Peramble-Wert befindet sich im Register 04h "Interrupt/Status 2"
Bit 6 und 5 wobei gilt:
* Bit 6 = 1 -> Valid Preamble
* Bit 5 = 1 -> Invalid Preamble

Eine weitere Möglichkeit wäre einen GPIO Pin zu konfigurieren der den Status
über HIGH und LOW Signale ausgibt.

```c
void printPreambleStatus(){
  uint8_t status = read(0x04);

  Serial.print("Valid: ");
  Serial.println((status >> 6) & 1);
  Serial.print("Invalid: ");
  Serial.println((status >> 5) & 1);
}
```

<br>

# SYNC Wort

Das Sync Wort kommt nach der Preamble und ist bei POCSAG 32Bit lang.
Der SI4432 unterstützt 5 verschiedene Längen von SYNC Wörtern:
* 0 Byte (0b000)
* 1 Byte (0b001)
* 2 Byte (0b010)
* 3 Byte (0b011)
* 4 Byte (0b100)

Das SYNC Wort selbst wird in bis zu 4 Registern gespeichert.

* 1 Byte = SYNC Word 3 (Register 36h)
* 2 Byte = SYNC Word 3, 2 (Register 36h, 37h)
* 3 Byte = SYNC Word 3, 2, 1 (Register 36h, 37h, 38h)
* 4 Byte = SYNC Word 3, 2, 1, 0 (Register 36h, 37, 38h, 39h)

Das SYNC Wort wird in absteigender Reihenfolge ausgesendet.

Bsp: SYNC Wort zusammenstellung bei 4 Byte
```c
uint32_t sync_word = (((word3 << 24) & (word2 << 16)) & (word1 << 8)) & word0 
```

```c
#define NO_SYNC_WORD 0
#define SYNC_WORD_1Byte 1
#define SYNC_WORD_2Byte 2
#define SYNC_WORD_3Byte 3
#define SYNC_WORD_4Byte 4

//length in byte
void setSYNC_Word(uint8_t length, uint32_t sync_word){
    
    if(length > 4){
      Serial.println("Sync Word is too big");
      return;
    }


    //set the SYNC word length in the header control register
    write(0x33, (read(0x33) & 0b11111001) | (length << 1));

    //fill the register
    if(length >= 1){
      //word 0
      write(0x36, (sync_word >> (8 * (length - 1))) & 0xFF);
    }

    if(length >= 2){
      //word 1
      write(0x37, (sync_word >> (8 * (length - 2))) & 0xFF);
    }

    if(length >= 3){
      //word 2
      write(0x38, (sync_word >> (8 * (length - 3))) & 0xFF);
    }

    if(length >= 4){
      //word 3
      write(0x39, sync_word & 0xFF);
    }
}
```

<br>

# RX Modem

Das RX Modem ist für die Demodulation und die Channel Selektion zuständig.
Weiters limitiert es die Bandbreite in der Signale empfangen werden. 

Für die Berechnung der Parameter können einige Formeln und eine Tabelle 
verwendet werden. Weiters wird die Datenrate und die Deviation / Shift für die
Berechnung benötigt.

Als erstes muss der Modulation Index (h) berechnet werden: 
```
modindex = 2 * deviation / (datarate * (1 + manchester)))
```
Info: machester ist 0 wenn Manchester-Encoding dekativiert ist, ansonsten 1

Als nächstes wird die Bandbreite des Bandfilters berechnet. Für diese Berechnung
gibt es zwei Formeln. je nach dem ob der ModulationsIndex größer oder kleiner 0
ist.
```
if modindex > 1
    bandwidth = (datarate / 2 * (1 + manchester) + 2 * deviation)
else
    bandwidth = (datarate * (1 + manchester) + deviation)

```

Mit diesem Wert kann dann in einer Tabelle nachgesehen werden, was die 
entsprechenden Werte für die Register ndec_exp, dwn3_bypass, fileset sind.

Diese Werte können meines Wissen nicht berechnet werden sondern nur aus der 
Tabelle ausgelesen werden.

Achtung es gibt 2 Tabellen einmal für FSK, GFSK und eine für OOK.

Nachdem die Werte aus der Tabelle ausgelesen wurden können nun die Werte 
für das rxosr, ncoff und crgain Register berechnet werden.

rxosr kann wie folgt berechnet werden:
```
rxosr = (500 * (1 + 2 * dwm3_bypass)) / (2^(ndec_exp - 3) * datarate * (1 + manchester))
```

ncoff:
```
ncoff = (datarate * (1 + manchester) * 2^(20 + ndec_exp)) / (500 * (1 + 2 * dwm3_bypass))
```

Die Formel die für den crgain in Datenblatt angegebn ist macht keinen 
Sinn. Daher wird eine andere Formel verwendet die auch andere Projekte
verwenden:
```
crgain = 2 + (65535 * int(datarate)) / int(rxosr * deviation)
```

Die ganzen Werte müssen in einen ganzzahligen Wert umgewandelt werden, da sie
sonst nicht in den Registern gespeichert werden können.

Info: In dem Datenblatt gibt es auch vorgeferitigte Werte für die Register 
welche man nutzen kann, falls der benötigte Werte dort dabei ist. 
Diese Werte sind in einer extra Tabelle organisiert. 

```c
//datarate in kbps / deviation in khz / manchester = 1 (true) or 0 (false)
void setupModem(double datarate, double deviation, uint8_t manchester){

  //TODO bounds checks

  //calculate the mod index (h)
  double modindex = (2 * deviation / (datarate * (1 + manchester)));

  double bandwidth;

  //calculate the bandwidth
  if(modindex > 1){
      bandwidth = (datarate / 2 * (1 + manchester) + 2 * deviation);
  }else{
      bandwidth = (datarate * (1 + manchester) + deviation);
  }

  uint8_t ndec_exp;
  uint8_t dwm3_bypass;
  uint8_t fileset;

  if(bandwidth <= 142.8){
      dwm3_bypass = 0;
  }else{
      dwm3_bypass = 1;
  }

  //this is the digitized version of a table located in the datasheet
  //it is not nice but i count find any consistency in the table that could 
  //have been used to calculate those values
  if(bandwidth <= 2.6){
      ndec_exp = 5;
      fileset = 1;
  }else if(bandwidth <= 2.8){
      ndec_exp = 5;
      fileset = 2;
  }else if(bandwidth <= 3.1){
      ndec_exp = 5;
      fileset = 3;
  }else if(bandwidth <= 3.2){
      ndec_exp = 5;
      fileset = 4;
  }else if(bandwidth <= 3.7){
      ndec_exp = 5;
      fileset = 5;
  }else if(bandwidth <= 4.2){
      ndec_exp = 5;
      fileset = 6;
  }else if(bandwidth <= 4.5){
      ndec_exp = 5;
      fileset = 6;
  }else if(bandwidth <= 4.9){
      ndec_exp = 4;
      fileset = 1;
  }else if(bandwidth <= 5.4){
      ndec_exp = 4;
      fileset = 2;
  }else if(bandwidth <= 5.9){
      ndec_exp = 4;
      fileset = 3;
  }else if(bandwidth <= 6.1){
      ndec_exp = 4;
      fileset = 4;
  }else if(bandwidth <= 7.2){
      ndec_exp = 4;
      fileset = 5;
  }else if(bandwidth <= 8.2){
      ndec_exp = 4;
      fileset = 6;
  }else if(bandwidth <= 8.8){
      ndec_exp = 4;
      fileset = 7;
  }else if(bandwidth <= 9.5){
      ndec_exp = 3;
      fileset = 1;
  }else if(bandwidth <= 10.6){
      ndec_exp = 3;
      fileset = 2;
  }else if(bandwidth <= 11.5){
      ndec_exp = 3;
      fileset = 3;
  }else if(bandwidth <= 12.1){
      ndec_exp = 3;
      fileset = 4;
  }else if(bandwidth <= 14.2){
      ndec_exp = 3;
      fileset = 5;
  }else if(bandwidth <= 16.2){
      ndec_exp = 3;
      fileset = 6;
  }else if(bandwidth <= 17.5){
      ndec_exp = 3;
      fileset = 7;
  }else if(bandwidth <= 18.9){
      ndec_exp = 2;
      fileset = 1;
  }else if(bandwidth <= 21.0){
      ndec_exp = 2;
      fileset = 2;
  }else if(bandwidth <= 22.7){
      ndec_exp = 2;
      fileset = 3;
  }else if(bandwidth <= 24.0){
      ndec_exp = 2;
      fileset = 4;
  }else if(bandwidth <= 28.2){
      ndec_exp = 2;
      fileset = 5;
  }else if(bandwidth <= 32.2){
      ndec_exp = 2;
      fileset = 6;
  }else if(bandwidth <= 34.7){
      ndec_exp = 2;
      fileset = 7;
  }else if(bandwidth <= 37.7){
      ndec_exp = 1;
      fileset = 1;
  }else if(bandwidth <= 41.7){
      ndec_exp = 1;
      fileset = 2;
  }else if(bandwidth <= 45.2){
      ndec_exp = 1;
      fileset = 3;
  }else if(bandwidth <= 47.9){
      ndec_exp = 1;
      fileset = 4;
  }else if(bandwidth <= 56.2){
      ndec_exp = 1;
      fileset = 5;
  }else if(bandwidth <= 64.1){
      ndec_exp = 1;
      fileset = 6;
  }else if(bandwidth <= 69.2){
      ndec_exp = 1;
      fileset = 7;
  }else if(bandwidth <= 75.2){
      ndec_exp = 0;
      fileset = 1;
  }else if(bandwidth <= 83.2){
      ndec_exp = 0;
      fileset = 2;
  }else if(bandwidth <= 90.0){
      ndec_exp = 0;
      fileset = 3;
  }else if(bandwidth <= 95.3){
      ndec_exp = 0;
      fileset = 4;
  }else if(bandwidth <= 112.1){
      ndec_exp = 0;
      fileset = 5;
  }else if(bandwidth <= 127.9){
      ndec_exp = 0;
      fileset = 6;
  }else if(bandwidth <= 137.9){
      ndec_exp = 0;
      fileset = 7;
  }else if(bandwidth <= 142.8){
      ndec_exp = 1;
      fileset = 4;
  }else if(bandwidth <= 167.8){
      ndec_exp = 1;
      fileset = 5;
  }else if(bandwidth <= 181.1){
      ndec_exp = 1;
      fileset = 9;
  }else if(bandwidth <= 191.5){
      ndec_exp = 0;
      fileset = 15;
  }else if(bandwidth <= 225.1){
      ndec_exp = 0;
      fileset = 1;
  }else if(bandwidth <= 248.8){
      ndec_exp = 0;
      fileset = 2;
  }else if(bandwidth <= 269.3){
      ndec_exp = 0;
      fileset = 3;
  }else if(bandwidth <= 284.9){
      ndec_exp = 0;
      fileset = 4;
  }else if(bandwidth <= 335.5){
      ndec_exp = 0;
      fileset = 8;
  }else if(bandwidth <= 361.8){
      ndec_exp = 0;
      fileset = 9;
  }else if(bandwidth <= 420.2){
      ndec_exp = 0;
      fileset = 10;
  }else if(bandwidth <= 468.4){
      ndec_exp = 0;
      fileset = 11;
  }else if(bandwidth <= 518.8){
      ndec_exp = 0;
      fileset = 12;
  }else if(bandwidth <= 577.0){
      ndec_exp = 0;
      fileset = 13;
  }else if(bandwidth <= 620.7){
      ndec_exp = 0;
      fileset = 14;
  }



  double rxosr_f = (500 * (1 + 2 * dwm3_bypass)) / (pow(2,ndec_exp - 3) * datarate * (1 + manchester));
  uint32_t rxosr = (uint32_t) rxosr_f;

  uint32_t ncoff = (uint32_t) ((datarate * (1 + manchester) * pow(2, 20 + ndec_exp)) / (500 * (1 + 2*dwm3_bypass)));

  //the formula that was mentioned in the datasheet does not really work for the crgain
  uint32_t crgain = (uint32_t) (2 + ((65535 * ((uint32_t) datarate)) / (uint32_t) (rxosr_f * deviation)));


  //write the values to the registers 

  //set the dwn3_bypass, ndec_exp and fileset in the register 1Ch
  write(0x1C, (((dwm3_bypass & 1) << 7) | ((ndec_exp & 0b111) << 4)) | (fileset & 0b1111));

  //set the rxosr in the register 20h and 21h
  write(0x20, rxosr & 0xFF);
  write(0x21, (read(0x21) & 0b00011111) | (((rxosr >> 8) & 0b111) << 5));

  //set the ncoff in the register 21h 22h 23h 
  write(0x23, ncoff & 0xFF);
  write(0x22, (ncoff >> 8) & 0xFF);
  write(0x21, (read(0x21) & 0b11110000) | ((ncoff >> 16) & 0b1111));

  //set the crgain in the register 24h 25h
  write(0x25, crgain & 0xFF);
  write(0x24, (crgain >> 8) & 0b111);
}
```

Info: das viel zu lange If-Else-Statement ist die digitalisierung der 
Tabelle. Ich habe leider keine Funktion gefunden, mit der ich die Werte aus 
der Tabelle errechnen hätte können. Sollte jemand solch eine Funktion finden 
würde ich mich darüber freuen.

Es ist auch relativ praktisch überprüfen zu können ob die Werte in den Tabellen
stimmen. Für dies kann folgende Funktion verwendet werden:
```c
void printModem(){

  uint8_t reg1C = read(0x1C);

  Serial.print("DW3: ");
  Serial.println(reg1C >> 7, HEX);
  Serial.print("ndec_exp: ");
  Serial.println((reg1C >> 4) & 0b111, HEX);
  Serial.print("fileset: ");
  Serial.println(reg1C & 0b1111, HEX);

  uint32_t rxosr = read(0x20);
  rxosr |= ((read(0x21) >> 5) & 0b111) << 8;
  Serial.print("rxosr: ");
  Serial.println(rxosr, HEX);

  uint32_t ncoff = read(0x23);
  ncoff |= read(0x22) << 8;
  ncoff |= (read(0x21) & 0b1111) << 16;
  Serial.print("ncoff: ");
  Serial.println(ncoff, HEX);

  uint32_t crgain = read(0x25);
  crgain |= (read(0x24) & 0b111) << 8;
  Serial.print("crgain: ");
  Serial.println(crgain, HEX);
}
```

Info: Mir persönlich ist vorgekommen, dass die Bandbreite des Bandpasses 
ein bisschen zu streng ist. Dieses Problem wird aber später behandelt. 

<br>

# Empfangen (direct mode)

Daten mit dem SI4432 empfangen kann ein bisschen trickreich sein, da es relativ
schwer ist den Chip zu debuggen. Daher würde ich empfehlen folgende Dinge per
Hand zu haben.

* RTL-SDR (Software Definded Radio) (RX)
* Funkgerät (zb. Baofeng)
* Osziloskop / Logic Analyszer.

Anstelle des Funkgerätes kann auch ein SDR mit Sendefähigkeit verwendet werden.
Es ist natürlich auch möglich die folgenden Schritte ohne dieses Equipment
durchzuführen, jedoch ist es dann schwerer Fehler schnell zu erkennen.
Bzw den Chip sinvoll einzustellen.

Zur Info:

RX Chip ----senden----> TX Chip


Normalesweise könnten wir das Offset-Register verändern, um den Sender auf 
die richtige Frequenz zu tunen. Jedoch geht dies in diesem Fall nicht, da der
AFC (Automatic Frequency Controll) das Register verändert und somit unseren
Offset zu nichte macht. 

Meiner Erfahrung nach geht es am leichtesten den Offset auf 0 zu belassen und 
mit dem RX Chip einmal Daten auszusenden (siehe Senden (direct mode)).
Mit dem SDR-RTL kann dann nachgesehen werden auf welcher Frequenz der Chip die 
Daten genau aussendet. Denn meistens Senden die Chips nicht auf der 
eingestellten Frequenz. (liegt vil an der Ungenauigkeit des Quarzes).

Wenn nun die eigentliche Frequenz ermittelt wurde, dann kann beim TX Chip der
Offset so eingestellt werden das dieser genau auf dieser Frequenz sendet. 
Beim TX Chip können wir das Offset Register verändern das der AFC das Register
nur im RX Modus verändert.

Offset einstellen:
```c
//offset in khz
void setOffset(double offset){

  uint8_t fbsr = read(0x75);
  uint8_t hbsel = (fbsr >> 5) & 0b1;

  uint16_t fo = offset / (0.15625 * (hbsel + 1));

  write(0x73, fo & 0xFF);
  write(0x72, (fo >> 8) & 0b11);
}
```
Info: Offset sind nicht wirklich in khz (Formel passt wahrscheinlich nicht ganz, also einfach eher nach Gefühl einstellen)

Mit dem RTL-SDR können wir dann wieder abgleichen ob der TX Chip nun auf der 
richtigen Frequenz sendet. 

Bsp Code für den TX-Chip: Code:
```
void loop() {
  
  if(Serial.available()){

    //--------do spi stuff here-------

    setOffset(22);
    sendData();
    reset();

    //---------------------------------

    delay(1500);
    while(Serial.available()){
      Serial.read();
    }
  }

  delay(100);
}
```
Offset ist bei jedem Chip anderes. (Gleiche Register-Werte bei 2 Chip = 2 
verschiedene Frequenzen)

Da nun die TX-Seite eingestellt ist und die Frequenzen angeglichen sind,
kommen wir nun wieder zum RX Chip und kümmern uns um den Empfang.

Für den Empfang müssen folgende Sachen eingestellt werdne:
* Frequenz
* Deviation
* Datenrate
* Modulationstyp
* Packet Handel (disable)
* Preamble
* SYNC Wort
* RX-Modem
* RX Mode

```c
void receive(){
  Serial.println("Setting Frequency");
  setFrequency(433);
  delay(100);
  Serial.println("Setting Deviation");
  setDeviation(4.5);
  delay(100);
  Serial.println("Setting Datarate");
  setDataRate(1.2);
  delay(100);
  Serial.println("Setting Modulation");
  setModulationType(FSK);
  delay(100);
  Serial.println("Disable Packet Handler");
  disablePacketHandler();
  delay(100);
  Serial.println("Setting Peramble");
  setPreamble(72,20);
  delay(100);
  Serial.println("Setting SYNC Words");
  setSYNC_Word(SYNC_WORD_4Byte, 0b10000011001011011110101000100111);  
  delay(100);
  Serial.println("Setting Modem");
  setupModem(1.2,4.5,0);
  delay(100);
  setRXMode();
}
```

Nun wurden alle alle benötigten Register eingestellt.

Info: Wenn ein Chip RX und TX können soll dann reicht theoretisch auch eine
Funnktion aus die die Dinge für RX und TX einstellt. (Einfach bei RX die 
fehlenden Sachen von TX hinzufügen oder anderersrum).

Um das Offset Problem kümmern wir uns später.

Nun muss nur noch der Chip in den RX Modus versetzt werden. Dies geschied wenn 
im Register 07h "Operating Mode and Function Control 1" das Bit 2 rxon auf 1 gesetzt wird. 

```c
void setRXMode(){
  write(0x07, (read(0x07) & 0b11111011) | 1 << 2);
}
```

Wenn nun die Funktion receive() aufgerufen wird, werden alle Register richtig
eingestellt und der Chip in den RX Modus versetzt.

Da wir den Chip aber auch im RX direkt Modus verwenden wollen, müssen wir noch
die empfangenen Daten herausführen. Dies funktioniert am besten wenn wir die
Daten auf einen eigenen GPIO Pin schreiben und zusätzlich noch eine Clock auf 
einen anderen GPIO Pin, damit zur richtigen Zeit abgetastet wird. 

GPIOs konfigurieren geht relativ einfach. Man muss nur in das ensprechende
Register des GPIOs einen Wert schreiben.

GPIO Register:
* GPIO0 -> 0Bh
* GPIO1 -> 0Ch
* GPIO2 -> 0Dh

Welche funktionen die GPIOs genau haben wird später erläutert. 
Für das Empfangen ist nur wichtig das wir einen als RX-Data definieren 
und den anderen als TX/RX Data clock und dies kann mit folgendem Befehlt 
erledigt werden.
```c
void enableRXOutputPins(){
  write(0x0B, 0b10100); //RX Data on GPIO 0
  write(0x0C, 0b01111); //RX Clock on GPIO 1
}
```

Das messen der Output Pins funktioniert am besten mit einem Oszilloskop,
sollte kein Osziloskop vorhanden sein, kann man auch das Preamble-Register
abfragen. Dies funktioniert relativ gut wenn man kein Osiloskop dabei hat.
Jedoch wenn etwas nicht funktioniert macht es das nicht gerade einfacher.
In dem Register steht weiters noch ob das SYNC Wort erkannt wurde, daher kann dies auch gleich mit ausgegeben werden.

Das Register (04h "Interrupt / Status 2") kann wie folgt abgefragt werden:
```c
void printPreambleAndSyncStatus(){
  uint8_t status = read(0x04);

  Serial.print("Valid Preamble: ");
  Serial.println((status >> 6) & 1);
  Serial.print("Invalid Preamble: ");
  Serial.println((status >> 5) & 1);
  Serial.print("SYNC Word detected: ");
  Serial.println((status >> 7) & 1);
}
```

Somit haben wir nun alles zusammen für die Empfangsseite:
```c
void loop() {
  
  if(Serial.available()){

    //--------do spi stuff here-------
    
    receive();
    enableRXOutputPins();
    
    //---------------------------------

    delay(1500);
    while(Serial.available()){
      Serial.read();
    }
  }
  printPreambleAndSyncStatus();
  delay(100);
}
```

Achtung! Es muss einmal ein Zeichen per UART gesendet werden, damit die RX 
Register konfiguriert werden und der Chip in den RX Modus wechselt. 

Wenn nun mit dem TX Chip Daten gesendet werden, sollten sie beim RX Data Pin 
ausgegeben werden und zusätzlich sollte das Valid-Preamble-Bit kurz auf 1 sein
und danach das SYNC-Word-Bit auch auf 1.
Das Valid-Premable-Bit geht nach der Preamble wieder auf 0, wohingegen das
SYNC-Word-Bit auf 1 bleibt.

Somit wurde ein erfolgreicher Transfer durchgeführt.
Hurray.

Hier noch ein paar kleine Debug Tipps:
* Wenn sich der RX-Chip in Receive gefindet aber nicht nichts empfängt, ggf 
mit eine Handfunkgerät in der nähe der Frequenz senden und schauen ob der dann 
was empfängt. Geräte wie das Baofeng erzeugen relativ viele Oberwellen und 
senden dann auch auf Frequenzen die nicht erwünscht sind, aber genau so könnte 
man die eigentlich Frequenz des RX Chips finden.
* Wenn man die Frequenz gefunden hat und HIGH und LOW am RX Ausgang sehen will,
aber kein Oszi hat, dann kann hier ein Handfunkgerät mit abgeschrauberter 
Antenne helfen. Diese Funkgerät sendet relativ gut nur auf einer Frequenz, da
die Oberwellen zu wenig Leistung haben um sichtbar zu sein. Somit kann man dann
auf der gewünschten HIGH Frequenz senden und ein konstantes Signal am RX Data 
Ausgang messen. 
* Es empfielt sich auch Antennen an die SI4432 Chips anzubringen, 
da sonst die Signale möglicherweise zu schwach sind.
* Ein konstantes Monotoring mit einem RTL-SDR und zb gqwrx ist auch sehr
hilfreich.

<br>

# Quarz / Frequenz tuning

Wie wir beim Senden bemerkt haben stimmt die Frequenz des Chips nicht wirklich 
mit der ein die wir eingestellt haben. Ich vermute das dies am Quarz liegt.
Der Chip selbst bietet hierfür eine Lösung an und zwar kann man den Quarz ein 
bissche "ziehen" (Frequenz verändern) um ihn auf die richtige Frequenz zu 
tunen. 

Die Werte für die Korrekte Frequenz kann mit einem RTL-SDR herausgefunden 
werden. Jedoch muss davor der RTL-SDR kalibriert werden, da dieser sonst 
die falschen Signale liefer (falscher Offset).
Um den SDR zu kalibieren gibt es ein sehr nützlicher Projekt namens 
kalibrate-rtl dies ist auf GitHub zu finden und verwendet GSM Stationen um 
den Fehler des RTL-SDRs zu ermitteln. Dieser Fehler kann dann zb. gwrx 
übergeben werden damit der offset angepasst wird.

Link Github: <a href="https://github.com/steve-m/kalibrate-rtl"> klibrate-rtl</a>

Verwendundung kalibrate-rtl:

Zuerst muss nach den Basestation gesucht werden, es gibt verschiedene Arten von
Basestations: GSM950, GSM900, EGSM, ... (-h für alle Optionen)
```
./kal -s GSM900
```

Wenn dieser Befehl erfolgreich durchgelaufen ist sollte er hoffentlich 
ein paar Stationen auflisten, wenn nicht dann am besten ein anderes 
Band auswählen.

Wenn es Basestation gefunden hat kann eine für die Kalibrirung verwendet werden
```
./kal -c 15
```
(kalibriere mit Basestation auf Kanal 15)

Dann sollte zum Schluss der Fehler in ppm ausgegeben werden.


So nun haben wir einen kalibrierten RTL-SDR und können nun das Register 
09h "Crystal Oscillator Load Capacitance" verwenden um den Si4432 richtig zu 
tunen. 

Leider habe ich keine sinvolle Formel gefunden mit der dieser Shift berechnet 
werden kann.
Somit ist das ein bisschen trial and error bis der Wert passt.
```c
//load 0 - 0b01111111 (127)
void setCrystalLoadCap(uint8_t load){
  write(0x09, (read(0x09) & 0b10000000) | (load & 0b01111111));
}
```
Je höher die Load desto kleiner wird ist die Frequenz.

Sollte dies nicht genug sein um den Quarz auf die richtige Frequnz zu ziehen, 
wäre es auch eine Idee einfach die Frequenz ein bisschen kleiner zu machen.

Info: Das Offset Register zu beschreiben ist keine gute Idee, da der AFC dies 
im RX-Mode überschreibt und somit diesen Offset zu nichte macht.

Achtung! Es könnte sein das dies negative Auswirkungen auf das Verhalten des 
Chips hat, jedoch ist mir bis jetzt noch nichts aufgefallen und in Datenblatt 
wird auch nichts erwähnt bezüglich Probleme. 

Ich bin mir zu diesem Zeitpunkt auch noch nicht sicher wie sich die Temperatur 
auf das Verhalten des Oszillators auswirkt. Kann mir gut vorstellen das eine
Temperaturschwankung zu einer Frequenzschwankung führen kann. Diese könnte 
theortische mithilfe des internen Temperatursensors ausgeglichen werden.

<br>

# Sende-Leistung