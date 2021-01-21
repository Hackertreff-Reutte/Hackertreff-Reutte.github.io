---
layout: post
author: HTR
post-title: Werkhaus Sign
tags: Arduino Projekt Werkhaus-Reutte
---



Da die Eröffnung des Werkhauses immer näher rückt, kam die Idee auf etwas dafür zu basteln. Und was passt besser auf eine leere Wand als ein großes Schild mit fancy LED Beleuchtung?

Nach einer gediegenen Brainstorming-Runde, in welcher Ideen zu Aussehen, Vorgehensweise und Material gesammelt wurden, kamen wir zu dem Entschluss aus einer Sperrholzplatte den Schriftzug “Werkhaus” auszuschneiden und indirekt zu Beleuchten.

Zuerst wurden die Platten auf das richtige Maß zugeschnitten.

<img src="{{ layout.post_assets | liquify }}/mas-schneiden.jpg" class="picture_center" style = "width: 30%; height: auto;" alt="Holzplatten die auf Maß geschnitten wird"/>

Nun hatten wir alle nötigen Begrenzungslinien eingezeichnet und es stellte sich die Frage, wie wir die Buchstaben auf die Platten bekommen, sodass deren Größe und Abstand zueinander optional ist.
Nach langem Überlegen kamen wir zu folgender Lösung.


<img src="{{ layout.post_assets | liquify }}/projektor.jpg" class="picture_center" style = "width: 60%; height: auto;" alt="Holzplate mit hinauf projizierten Schriftzug"/>

Wir stellten die Platte vor einen Beamer und projizierten die Schrift gespiegelt auf die Platte.
Der Schriftzug der hier zu erkennen ist besteht eigentlich aus 2 verschiedenen Schriftarten, da uns einige Buchstaben bei der jeweiligen Schriftart einfach nicht gefielen.
Kurz gesagt, haben wir das beste der beiden Schriftarten vereint.
Danach ging es weiter mit dem Ausschneiden der Buchstaben.


<img src="{{ layout.post_assets | liquify }}/ausschneiden.jpg" class="picture_center" style = "width: 40%; height: auto;" alt="Holzplatte wo die Buchstaben gerade ausgeschnitten werden"/>

Nach einigen Stunden Arbeit war es dann geschafft. Die Buchstaben waren ausgeschnitten und zu unserer Verwunderung brachen uns die unstabilen Stellen nicht weg. Hurray.
Nun musste nur noch die Rückseite zusammengeschraubt und angemalt (ansonsten gäbe es zu wenig Kontrast) werden.

<br>

Nun war es geschafft, jetzt fehlte nur noch der Transport ins Werkhaus und die Verkabelung.
Mithilfe einiger Freiwilliger des Werkhauses war jedoch auch dies kein Problem.

So, das Ende naht, jetzt mussten nur noch die WS2812 LED-Strips angebracht und mit Strom versorgt werden. Nach einigem Debuggen und bisschen Code schreiben war das Projekt abgeschlossen.

<img src="{{ layout.post_assets | liquify }}/sign_leuchten1.jpg" class="picture_center" style = "width: 50%; height: auto;" alt="Beleuchtetes Schild v1"/>
<img src="{{ layout.post_assets | liquify }}/sign_leuchten2.jpg" class="picture_center" style = "width: 50%; height: auto;" alt="Beleuchtetes Schild v2"/>

Weitere Dokumentation zum Schild und zum Programmcode folgt.

Die Idee ist, dass es jedem Mitglied möglich sein sollte sein eigenes Programm auf dem Schild zum laufen zu bringen. Sodass das Ganze zu einem Community Projekt wird.

Mitwirkende Personen:
Alex, Bene, Jojo
