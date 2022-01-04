---
layout: post
author: HTR
post-title: "DIY 433MHz ISM POCSAG Pager #4"
tags: AFU Arduino Funk Projekt Pager
published: false
---

Im letzten Blogpost wurde der SI4432 etwas genauer unter die Lupe genommen. Daher geht es nun in 
diesem Blogpost darum den besagten Chip zu verwenden und einen vollwertigen POCSAG Transceiver zu
entwickeln. Angesteuert wird der SI4432 mithilfe eines ESP32 uC. 

<br>

# POCSAG Spezifikation (technisch)

Um POCSAG Nachrichten zu versenden müssen einige Dinge beachtet werden. Zuerst die technischen:

* Deviation / Shift = +- 4.5kHz
* Modulation: FSK
* Datenrate: 512Bps / 1200Bps / 2400Bps
* Bandbreite = 9kHz
* 0 Bit = Carrier - 4.5kHz
* 1 Bit = Carrier + 4.5kHz
* 576 Bit Preamble

In diesem Beispiel wird für die Datenrate 1200Bps verwendet. Kann jedoch sehr leicht abgeändert 
werden falls gewünscht.


Für die implementierung der einzelnen Funktionalitäten werden die Funktionen verwendet, die im
letzten Blogpost entwickelt wurden.

```c
double DATARATE = 1.2;
double FREQUENCY = 433;
double MODEM_DEVIATION = DEVIATION * 4;
#define DEVIATION 4.5
#define FSK 0b10
#define SYNC_WORD_4Byte 4


void setupSI4432Pocsag(){
  setFrequency(FREQUENCY);
  setDeviation(DEVIATION);
  setDatarate(DATARATE);
  setModulationType(FSK);
  disablePacketHandler();
  setPreamble(72,20); //72 * 8 = 576
  setupModem(DATARATE,MODEM_DEVIATION,0);
  setSYNC_Word(SYNC_WORD_4Byte, 0b10000011001011011110101000100111);  
}
```

Der Packet-Handler müsste eigentlich nicht deaktiviert werden, jedoch gibt es auch keinen 
Grund diesen aktiviert zu lassen, da direct RX und TX verwendet wird.

Bei setPreamble(72, 20) geben die 20 die Mindestmenge an Preamble bytes an die empfangen
werden müssen bevor die Preamble als valide gilt. Dieser Wert kann nicht ganz zufällig 
gewählt werden, da er eine minimum Größe haben muss, damit sich der SI4432 auf das 
Signal einstellen kann (Siehe Datenblatt).

setupModem(DATARATE,MODEM_DEVIATION,0) stellt mehr oder weniger den "Input-Filter" ein. Je größer 
MODEM_DEVIATION ist, desto weiter kann das Signal (RX) von erwarteten Signal abweichen und 
trotzdem Empfangen werden. (Achtung Offset passt sich immer auf das letzte Signal an (TX 
geschieht dann auf dieser neuen Frequenz)). 
Ab und zu ist es recht praktisch dieses Fenster nicht zu klein zu wählen, da die Quarze auf 
den SI4432 Muodulen nicht gerade die stabilsten sind. 

Dieser Frequenz drift könnte auch zu einem gewissen Grad mithilfe des Temp-Sensors des SI4432
und der "Quarzziehfunktion" kompensiert werden. 

Die Funktion setSYNC_Word(SYNC_WORD_4Byte, 0b10000011001011011110101000100111); wird benötigt,
damit nach der Preamble das SYNC-Word erkannt wird. (Preamble + SYNC Word wird vom SI4432 immer 
benötigt). Achtung! Die Bits des SYNC Words sind invertiert. Dies hat damit zu tun da der 
SI4432 bei einem 1er (Carrier + Deviation) aussendet und bei einem 0er (Carrier - Deviation) 
aussendet. Jedoch ist es bei POCSAG genau invertiert. 

So nun ist der SI4432 einmal von der technischen Seite vorbereitet.

<br>

# Kommunikation SI4432 und ESP32

Damit der ESP32 mit dem SI4432 kommunizieren kann (nicht programmierung über SPI) müssen die GPIOs
bzw. der SI4432 selbst dafür programmiert werden.

Kommunikation:
* RX Data über GPIO Pin
* TX Data über SPI
* RSSI über GPIO ("Free Channel Indicator")
* Preamble Detected über GPIO

```c
double DATARATE = 1.2;
double FREQUENCY = 433;
double MODEM_DEVIATION = DEVIATION * 4;
#define DEVIATION 4.5
#define FSK 0b10
#define SYNC_WORD_4Byte 4

#define SOURCE_DIRECT_SPI 0b01
#define NO_TX_DATA_CLK 0b00

#define INTERRUPT_PIN 5
#define RX_CLOCK_PIN 18
#define RX_DATA_PIN 19
#define RSSI_PIN 21


void setupSI4432Pocsag(){
  setFrequency(FREQUENCY);
  setDeviation(DEVIATION);
  setDatarate(DATARATE);
  setModulationType(FSK);
  disablePacketHandler();
  setPreamble(72,20);
  setSYNC_Word(SYNC_WORD_4Byte, 0b10000011001011011110101000100111);  
  setupModem(DATARATE,MODEM_DEVIATION,0);
  
  
  setModulationDataSource(SOURCE_DIRECT_SPI);
  setDirectClockSource(NO_TX_DATA_CLK);

  pinMode(RX_CLOCK_PIN, INPUT);
  pinMode(RX_DATA_PIN, INPUT);
  pinMode(INTERRUPT_PIN, INPUT);
  pinMode(RSSI_PIN, INPUT);

  write(0x06, 0b01000000); // disable interrupt (only Preamble interrupt)

  enableRXOutputPins();
  
  write(0x0D, 0b11100); //RSSI clear channel indicator on GPIO 2

  //register interrupt
  attachInterrupt(INTERRUPT_PIN, si4432_ISR, FALLING);

  read(0x07); //reset interrupts by reading the interrupt register
}
```

Es würde auch andere Methoden geben, um die Daten an den SI4432 zu übermitteln bzw. zu empfangen.
Jedoch ist es nicht sehr sinnvoll diese zu verwenden, da die GPIO Anzahl auf dem Chip
sehr begrenzt ist und somit benötigte Ressourcen belegt werden.

Die beiden schreibzugriffe auf die Register 0x07 und 0x0D werden benötigt und die Interrupt in 
einen definierten Zustand zu setzten.

Weiters werden alle nicht benötigten Interrupts mittels des schreibzugriffes auf das Register 
0x06 deaktiviert.

Für genauere Infos was diese Schreibvorgänge bewirken rate ich dazu sich das Datenblatt anzusehen,
denn ich möchte in diesem Blog Post nicht zu sehr in die Details gehen.

Der IRQ (Interrupt) Pin des SI4432 wird von ESP32 mithilfe eines Interrupts überwacht.
(Später dazu mehr)

<br>

Nun ist das komplette Setup des SI4432 abgeschlossen und wir können uns um die eigentlich Kommunikation kümmern. 

<br>

# Setup Function

```c
#define SDN 16
#define BUFFER_SIZE 1000

DMASPI::DMASPI spi;
static const int spiClk = 100000; // 100 kHz

void setup() {

  delay(5000);

  Serial.begin(115200);

  Serial.println("Setting up SPI");

  rx_buf = (uint8_t*)heap_caps_malloc(BUFFER_SIZE, MALLOC_CAP_DMA);
  tx_buf = (uint8_t*)heap_caps_malloc(BUFFER_SIZE, MALLOC_CAP_DMA);

  spi.begin(HSPI, 14, 12, 13, 1);

  pinMode(HSPI_SS, OUTPUT);
  digitalWrite(HSPI_SS, HIGH);


  Serial.println("booting SI4432");
  
  //this reset is important because otherwise spi might not be working on the
  //si4432
  pinMode(SDN, OUTPUT);
  digitalWrite(SDN, HIGH);
  delay(500);
  digitalWrite(SDN, LOW);
  delay(1000); // wait for the chip to boot
  Serial.println("Now in IDLE");

  setupSI4432Pocsag();
}
```

Zuerst wird hier die Buffersize für RX und TX festgelegt. Diese geröße ist die maximale Größe an
Daten in einem Durchgang empfangen / gesendet werden kann.
Achtung! Weiters muss das SPI DMA Limit betrachtet werden. (Kann jedoch in der DMA SPI lib geändert 
werden)

Der Reset des SI4432 ist essential, da es sonst passieren kann das der Chip nicht richtig 
funktioniert.



# Loop Function

```c
void loop() {
  
  if(Serial.available()){

    char opt = Serial.read();

    //calibrate
    if(opt == 'C'){
      uint8_t offset = Serial.readString().toInt();
      setCrystalLoadCap(offset);
      Serial.print("Changed offset to: ");
      Serial.println(offset);
    }

    //change frequency
    if(opt == 'F'){
      FREQUENCY = Serial.readString().toDouble();
      setFrequency(FREQUENCY);
      Serial.print("Set frequency to: ");
      Serial.println(FREQUENCY);
    }

    //change datarate
    if(opt == 'D'){
      DATARATE = Serial.readString().toDouble();
      setDatarate(DATARATE);
      setupModem(DATARATE,MODEM_DEVIATION,0);
      Serial.print("Set datarate to: ");
      Serial.println(DATARATE);
    }

    //change moden bandwith via deviation
    if(opt == 'M'){
      MODEM_DEVIATION = Serial.readString().toDouble();
      setupModem(DATARATE,MODEM_DEVIATION,0);
      Serial.print("Set modem bandwidth");
    }

    //chang to RX mode
    if(opt == 'R'){

      while(!Serial.available()){
        __asm__("nop");
      }
      opt = Serial.read();

      if(opt == 'X'){
        setRXMode();
        read(0x07);
        Serial.println("Now in RX");
      }
    }

    //change to idle mode
    if(opt == 'I'){

      while(!Serial.available()){
        __asm__("nop");
      }
      opt = Serial.read();

      if(opt == 'D'){
        setIDLEMode();
        read(0x07);
        Serial.println("Now in iDLE");
      }
    }

    //reboot si4432
    if(opt == 'B'){
      digitalWrite(SDN, HIGH);
      delay(500);
      digitalWrite(SDN, LOW);
      delay(1000);
      setupSI4432Pocsag();
      Serial.println("si4432 rebooted!");
    }

    //transmit 
    if(opt == 'T'){
      while(!Serial.available()){
        __asm__("nop");
      }
      opt = Serial.read();
      
      //! send test data
      if(opt == '!'){
        sendTestData();
        Serial.println("Sent Test-Data!");
      }

      //X transmitt
      if(opt == 'X'){
        sendUARTData();
        Serial.println("Sent POCSAG message!");
      }
    }

    while(Serial.available()){
      Serial.read();
    }
  }


  if(si4432_isr){
    si4432_ISR_handler();
  }

  if(si4432_active_receive >= 1){
    if(si4432_active_receive >= 2){
      si4432_active_receive = 0;
      detachInterrupt(RX_CLOCK_PIN);
      detachInterrupt(RSSI_PIN);
      setIDLEMode();

      //send the data
      for(int i = 0; i < si4432_count; i++){
        for(int j = 7; j >= 0; j--){
          if(((tx_buf[i] >> j) & 1) == 1){
            Serial.print("1");
          }else{
            Serial.print("0");
          }
        }
      }
      delay(100);

      //return to RX MODE
      setRXMode();
    }
  }
}
```

Diese Loop Funktion behandelt alle Anfragen die über Serial an den ESP gesendet werden können.
Im Nachfolgenden werden diese Funktionen Schritt für Schritt erklärt.

<br>

## Calibrate

```c
//calibrate
if(opt == 'C'){
  uint8_t offset = Serial.readString().toInt();
  setCrystalLoadCap(offset);
  Serial.print("Changed offset to: ");
  Serial.println(offset);
}
```

Die Funktion kann verwendet werden, um die Frequenz des Quarzes feinabzustimmen. 
Natürlich könnte dafür auch das Offset Register verwendet werden, da aber der Chip senden 
und empfangen soll und das RX-Modem sich um dieses Register kümmert. Ist dies der einzige 
Weg die Frequenz einzustellen. 

Wird eigentlich nur benötigt wenn vorher noch nichts empfangen wurde und die Frequenz angepasst werden soll. (Ist ganz praktisch für Testzwecke, denn dann kann man sicher gehen, dass die Freuquenz stimmt 
(Prüfung mit zB. SDR))

__Nachtrag:__<br>
Das Offset-Register wird von Chip im Empfangsmodus automatisch gesetzt. 
Dies geschiet wenn ein Signal empfangen wird, dann stellt der Empfänger das
Offset Register automatisch so ein, das der Empfänger genau auf das empfangene Signal abgestimmt ist. (Ermöglicht den Empfang von Signalen die 
ein klein wenig von der einstellten Frequenz abweichen).
