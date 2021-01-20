---
layout: post
author: HTR
post-title: DIY 433MHz ISM POCSAG Pager
tags: AFU Arduino Funk Projekt Pager
---

Heute möchten wir euch unsere neue Projekt-Idee vorstellen. Geplant ist einen POCSAG-fähigen Pager zu entwickeln, der Nachrichten empfangen und diese auf einem Display anzeigen kann.
Zudem soll ein Sender gebaut werden, der die BFSK-modulierten POCSAG-Signale aussenden kann. 

<br>
**Hardware Transceiver:**
Der erste Schritt bestand aus dem Finden eines FSK-Transceivers, der die Signale sowohl aussenden als auch empfangen kann. Nach kurzer Recherche wurden wir fündig und bestellten ein Devboard mit CC1101-Chip.
Nach einigen Versuchen stellte sich heraus, dass der Chip nur dazu in der Lage war ein 16 Bit langes Syncword, bzw. ein 32 Bit langes bei Spiegelung (Syncword + Syncword), zu verwenden.
Dies stellte ein Problem dar, da der POCSAG-Standard ein 32 Bit langes Syncword (FSC) verwendet, welches sich nicht wiederholt, weshalb auch die “Spiegelfunktion”, des CC1101 nicht verwendet werden konnte. Ein anderer Chip musste also her.

<br>
**Hardware Transceiver V2:**
Nach erneuter Internetrecherche (diesmal mit genauerer Recherche des Datenblattes :D) kamen wir auf den SI4432-Chip.
Dieser erfüllte nun alle Vorgaben, die man für einen POCSAG-Pager benötigt. Er wurde über AliExpress bestellt. Momentan warten wir auf sein Eintreffen.

<br>
**Steuereinheit:**
Als Steuereinheit ist ein Arduino angedacht. Dieser hat zwar einen recht hohen Stromverbrauch im Gegensatz von zum Beispiel einem STM32, jedoch ist er leichter zu “hacken” und bietet so einen leichteren Einstieg für Leute, die sich nicht so tief mit der Materie aufkennen bzw. noch nie mit einem STM32 oder ähnlichem gearbeitet haben.

<br>
**Display:**
Als Display wird entweder ein OLED- oder ein LCD-Screen verwendet, der voraussichtlich über I2C angesteuert wird, da SPI schon für den Transceiver verwendet wird.
Die Planung der Displaylösung ist jedoch noch nicht sehr weit fortgeschritten, weshalb wir diese später noch im Detail besprechen werden.
Eine weitere Option wäre ein eInk-Displays gewesen, gegen welche jedoch der momentan sehr hohe Preis spricht.

<br>
**POCSAG:**
Für den POCSAG-Standard wurde folgendes Dokument als Anleitung verwendet:
[Link](https://www.raveon.com/pdfiles/AN142(POCSAG).pdf)


Mitwirkende Personen:
Alex, Bene, Jakob