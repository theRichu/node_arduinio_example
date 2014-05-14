nt state;
int onoff;
int last_onoff;
int last_state;

int state_r;
int state_y;
int state_g;



void setup(){

  pinMode(10, INPUT_PULLDOWN);
  pinMode(11, INPUT_PULLDOWN);
  
  pinMode(16, OUTPUT);
  pinMode(17, OUTPUT);
  pinMode(18, OUTPUT);

  SerialUSB.begin();
  SerialUSB.attachInterrupt(usbInterrupt);
}

void usbInterrupt(byte* buffer, byte nCount){

   if((char)buffer[0]=='1') onoff=0;
   else if((char)buffer[0]=='2') onoff=1; 
   
   //R
      if((char)buffer[1]=='1') state_r=0;
   else if((char)buffer[1]=='2') state_r=1; 
   
   //Y
      if((char)buffer[2]=='1') state_y=0;
   else if((char)buffer[2]=='2') state_y=1; 
   
   //G
      if((char)buffer[3]=='1') state_g=0;
   else if((char)buffer[3]=='2') state_g=1; 
   
    SerialUSB.print(onoff);
    SerialUSB.print(state_r);
    SerialUSB.print(state_y);
    SerialUSB.println(state_g);

}


void loop(){

  int button1 = digitalRead(10);
  int button2 = digitalRead(11);
  
  

  if((button1!=last_onoff) && (button1)){ //Get Raising Edge
    onoff = (onoff)?0:1;
    
    SerialUSB.print(onoff);
    SerialUSB.print(state_r);
    SerialUSB.print(state_y);
    SerialUSB.println(state_g);    
  }
  
  if((button2!=last_state) && (button2)){ //Get Raising Edge
    state++;
    if(state==7) state=0;

  switch(state){
   case 0:
    state_r=1;
    state_y=0;
    state_g=0;    
   break;
   
   case 1:
    state_r=0;
    state_y=1;
    state_g=0;    
   break; 
   
   case 2:
    state_r=1;
    state_y=1;
    state_g=0;    
   break; 
   
   case 3:
    state_r=0;
    state_y=0;
    state_g=1;    
   break; 
   
   case 4:
    state_r=1;
    state_y=0;
    state_g=1;    
   break; 
   
   case 5:
    state_r=0;
    state_y=1;
    state_g=1;    
   break; 
   
   case 6:
    state_r=1;
    state_y=1;
    state_g=1;    
   break; 
   
  }
    SerialUSB.print(onoff);
    SerialUSB.print(state_r);
    SerialUSB.print(state_y);
    SerialUSB.println(state_g);
  }
  

  
  
  if(onoff==HIGH){
    if(state_r){
        digitalWrite(16, LOW);
    }else {
        digitalWrite(16, HIGH);
    }    
  
    if(state_y){
        digitalWrite(17, LOW);
    }else {
        digitalWrite(17, HIGH);
    }    
  
  
    if(state_g){
        digitalWrite(18, LOW);
    }else {
        digitalWrite(18, HIGH);
    }    
  }
  if(onoff==LOW){
    digitalWrite(16, HIGH);
    digitalWrite(17, HIGH);
    digitalWrite(18, HIGH);
  }

  last_onoff = button1;
  last_state = button2;

}







