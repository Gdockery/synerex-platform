/**
 * USB RS485 of MODBUS info from SDM630 digital meter 
 * Based on code found http://123solar.org/phpBB/viewtopic.php?t=232
 * that was written by Mario Stuetz (mstuetz at gmail.com)
 * Minor modifications below by James Rudd (sdm at jrudd.org)
 * gcc sdm630-usb.c -o sdm630 `pkg-config --cflags --libs libmodbus`
 **/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sysexits.h>
#include <modbus/modbus.h>
#include <sys/resource.h>

#define SERVER_ID 1

float reform_uint16_2_float32(uint16_t u1, uint16_t u2)
{
	uint32_t num = ((uint32_t)u1 & 0xFFFF) << 16 | ((uint32_t)u2 & 0xFFFF);
	float numf;
	memcpy(&numf, &num, 4);
	return numf;
}

int main(int argc, char *argv[]){
	modbus_t *sdm630;
	int iReturn = 0;
	time_t now;

	char *cmd = "od -x /dev/urandom | head -1 | awk '{OFS=\"-\"; print $2$3,$4,$5,$6,$7$8$9}'";
	char buf[128];
	FILE *fp;

	sdm630 = modbus_new_rtu("/dev/ttyUSB0", 19200, 'N', 8, 1);
	modbus_set_slave(sdm630, SERVER_ID);
	modbus_set_debug(sdm630, FALSE);
	time(&now);

	if (sdm630 == NULL) {
		fprintf(stderr, "Unable to allocate libmodbus context\n");
		return EX_IOERR; /* 74 input/output error */
	}
	if (modbus_connect(sdm630) == -1) {
		fprintf(stderr, "Connection failed: \n");
		modbus_free(sdm630);
		return EX_NOINPUT; /* 66 cannot open input */
	}

	uint16_t* catcher = malloc(120*sizeof(uint16_t));
	int j = 0;
	if(modbus_read_input_registers(sdm630, 0x0000, 79, catcher)>0) {
                printf("{\"1160\": %.1f, ", (float) catcher[30] / 10); //l1Volt
                printf("\"1162\": %.1f, ", (float) catcher[31] / 10); //l2Volt
                printf("\"1164\": %.1f, ", (float) catcher[32] / 10);  //l3Volt
                printf("\"1144\": %.1f, ", (float) catcher[33] / 10); //l1Amp
                printf("\"1146\": %.1f, ", (float) catcher[34] / 10);  //l2Amp
                printf("\"1148\": %.1f, ", (float) catcher[35] / 10);  //l3Amp
                printf("\"1170\": %.1f, ", (float) (((int16_t)catcher[30] / 10)  * ((int16_t)catcher[33] / 10) / 1000) * abs((int16_t)catcher[48] / 10)/100); //kw
                printf("\"1172\": %.1f, ", (float) (((int16_t)catcher[31] / 10)  * ((int16_t)catcher[34] / 10) / 1000) * abs((int16_t)catcher[49] / 10)/100); //kw
                printf("\"1174\": %.1f, ", (float) (((int16_t)catcher[32] / 10)  * ((int16_t)catcher[35] / 10) / 1000) * abs((int16_t)catcher[50] / 10)/100); //kw
		printf("\"1178\": %.1f, ", (float) (((int16_t)catcher[30] / 10)  * ((int16_t)catcher[33] / 10)) / 1000); //kVA
                printf("\"1180\": %.1f, ", (float) (((int16_t)catcher[31] / 10)  * ((int16_t)catcher[34] / 10)) / 1000); //kVA
                printf("\"1182\": %.1f, ", (float) (((int16_t)catcher[32] / 10)  * ((int16_t)catcher[35] / 10)) / 1000); //kVA
                printf("\"2302\": %.1f, ", (float) (int16_t)catcher[48] / 10); //PowerFactor
		printf("\"2304\": %.1f, ", (float) (int16_t)catcher[49] / 10); //PowerFactor
                printf("\"2306\": %.1f, ", (float) (int16_t)catcher[50] / 10); //PowerFactor
                printf("\"1186\": %.1f, ", (float) (int16_t)catcher[66] / 10); //l1kvar
                printf("\"1188\": %.1f, ", (float) (int16_t)catcher[67] / 10); //l2kvar
                printf("\"1190\": %.1f, ", (float) (int16_t)catcher[68] / 10); //l3kvar
                printf("\"2326\": %.1f, ", (float) catcher[60] / 10); //l1THD
		printf("\"2328\": %.1f, ", (float) catcher[61] / 10); //l2THD
		printf("\"2330\": %.1f, ", (float) catcher[62] / 10); //l3THD

		if ( catcher[34] / 10 < 10 ) // l2amp is off, turn pf off
		{
               	    printf("\"off_flag\": %.1f, ", (float) catcher[34] / 10);  //l2Amp
		    FILE *fp;

		    fp = fopen("/home/pi/stayoff", "w"); // "w" mode creates the file

		    fclose(fp);
		 } else if ( catcher[34] / 10 > 20) { //there is current, turn on if we were off. (between 10-19 amps do nothing)
               	    printf("\"rem_off_flag\": %.1f, ", (float) catcher[34] / 10);  //l2Amp
		    remove("/home/pi/stayoff");
		 }
		/*
if test -f "/home/pi/turnon"; then
  if test -f "/home/pi/pfison"; then
    echo "pf is on"
    sudo rm /home/pi/pfisoff
  else 
    echo "turn on pf"
    /opt/sdm630/sdm630_on
      sudo rm /home/pi/turnon
      sudo rm /home/pi/pfisoff
      sudo touch /home/pi/pfison
      sudo rm /home/pi/turnoff
  fi
fi

if test -f "/home/pi/turnoff"; then
  if test -f "/home/pi/pfisoff"; then
    echo "pf is off"
    sudo rm /home/pi/pfison
  else 
    echo "turn off pf"
    /opt/sdm630/sdm630_off 
      sudo rm /home/pi/turnoff
      sudo rm /home/pi/turnon
      sudo rm /home/pi/pfison
      sudo touch /home/pi/pfisoff
  fi
fi*/
		for (int i = 0; i < 79; i++) {
			printf("\"%d\": %d, ", i+3001, catcher[i]);
		}	
		printf("\"recordedAt\": %d, ",now);
	} else {
	   printf("no return");
	   iReturn = EX_DATAERR;
	}
	free(catcher);

	modbus_close(sdm630);
	modbus_free(sdm630);

	if ((fp = popen(cmd, "r")) == NULL) {
		printf("\"id\": \"oops\"}");
		return iReturn;
	}
	
	printf("\"id\": \"");

	int i=0;

	while (fgets(buf, 2, fp) != NULL && i < 38) {
		if (i++ < 36) { 
			printf("%s",buf);
		}
	} 
	printf("\"}");

	return iReturn;
}
