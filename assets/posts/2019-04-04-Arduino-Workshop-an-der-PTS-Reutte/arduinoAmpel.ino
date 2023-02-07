

int zeit_rot = 5000; //5 sec in der rot Phase
int zeit_gruen = 5000; //5 sec in der grün Phase
//können im Betrieb mit Button ignoriert werden

int current_state = 0;  //0 = rot     1 = grün


void setup()	//Funktion setup() wird als erstes aufgerufen.
{
  pinMode(2, OUTPUT);	//Pin 2 (grüne LED) als Output definieren
  pinMode(3, OUTPUT);	//Pin 3 (gelbe LED) als Output definieren
  pinMode(4, OUTPUT);	//Pin 4 (rote  LED) als Output definieren 

  pinMode(5, INPUT);	//Pin 5 (Button) als Input definieren.
    
  digitalWrite(4, HIGH);	//Pin 4 (rote LED) auf 5V legen
  digitalWrite(3, LOW);		//Pin 3 (gelbe LED) auf 0V legen
  digitalWrite(2, LOW);	    //Pin 2 (grüne LED) auf 0V legen
}


void rot(){					
  digitalWrite(4, HIGH);	//Pin 4 (rote LED) auf 5V legen
  digitalWrite(3, LOW);		//Pin 3 (gelbe LED) auf 0V legen
  digitalWrite(2, LOW);		//Pin 2 (grüne LED) auf 0V legen
  //delay(zeit_rot);			//Program wartet hier "zeit_rot" lang.
  //auskommentiert wegen Button
}

void rot_gelb(){			//Funktion rot_gelb()
  digitalWrite(4, HIGH);
  digitalWrite(3, HIGH);
  digitalWrite(2, LOW);
  delay(1500);
}

void gruen(){
  digitalWrite(4, LOW);
  digitalWrite(3, LOW);
  digitalWrite(2, HIGH);
  //delay(zeit_gruen);
  //auskommentiert wegen button
}

void gruen_blinken(){
  
  digitalWrite(4, LOW);
  digitalWrite(3, LOW);
  
  for(int i = 0; i < 4; i++){	//wird solange ausgeführt bis i >= 4 ist
    delay(1000);				//mit jedem Durchgang wird i um 1 erhöht
  	digitalWrite(2, LOW);		//Google: for-Schleife
    delay(1000);
    digitalWrite(2, HIGH);
  }
  
  digitalWrite(2, LOW);
}

void gelb(){
  digitalWrite(4, LOW);
  digitalWrite(3, HIGH);
  digitalWrite(2, LOW);
  delay(2000);
}



void rot_zu_gruen(){
  rot_gelb();		
  gruen();			
}


void gruen_zu_rot(){
  gruen_blinken();
  gelb();
  rot();    //ruft Funktion rot() auf und führt den Code
  			//aus der Funktion aus
}


void loop()
{
  delay(200); // dieses delay ist nur im Simulationsprogramm notwenig,
  			  // da durchgendes auslesen des Zustandens des Button
  			  // viel Rechenleistung benötigen würde. (Folge: langsames simulieren)
  
  
  int button_state = digitalRead(5);
  
  
  if(button_state == HIGH){ //wenn Button gedrückt dann führe den
    						//Code im IF-Statement aus.
    
    if(current_state == 0){  //Wenn "current_state" dem Wert 1 entspricht,
      					     //dann wird folgender Code ausgeführt (in der Klammer)
      
      rot_zu_gruen();	//wechselt von rot zu grün
      current_state = 1; //stellt den Status auf Grün
      
    }else{	//sollte oberes IF-Statement nicht zutreffen, dann führe
      		//folgenden aus. (bezogen auf "current_state")
      
      gruen_zu_rot();  //wechselt von grün zu rot
      current_state = 0; //stellt den Status auf Rot
    }
  }
}