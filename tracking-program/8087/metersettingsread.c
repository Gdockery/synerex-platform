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

	//printf ("%s\n",cmd);

	sdm630 = modbus_new_tcp("192.168.1.105", 502);
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
	//else if(modbus_connect(sdm630) == 0) {
		// Succesfully Connected 
	//	printf("[MODBUS]\n");
   	//}


	uint16_t* catcher = malloc(44*sizeof(uint16_t));
	if(modbus_read_registers(sdm630, 0x0899, 44, catcher)>0){			
		printf("\"Demand Window Type\": %f, ",catcher[0]);		
		printf("\r\n\"Demand Window\": %f, ",catcher[1]);
		printf("\r\n\"Volt Multiplier VINPUT1\": %f, ",reform_uint16_2_float32(catcher[2],catcher[3]));
		printf("\r\n\"Volt Multiplier VINPUT2\": %f, ",reform_uint16_2_float32(catcher[4],catcher[5]));			
		printf("\r\n\"Service Type Element\": %f, ",catcher[6]);
		printf("\r\n\"Millivolt Snap Threshold\": %f, ",reform_uint16_2_float32(catcher[7],catcher[8]));
		printf("\r\n\"RoCoil Snap Threshold\": %f, ",reform_uint16_2_float32(catcher[9],catcher[10]));
		printf("\r\n\"Voltage Snap Threshold\": %f, ",reform_uint16_2_float32(catcher[11],catcher[12]));			
		printf("\r\n\"Communications Mode\": %f, ",catcher[13]);
		printf("\r\n\"RoCoil Millivolt per Kiloamp\": %f, ",reform_uint16_2_float32(catcher[14],catcher[15]));			
		printf("\r\n\"Voltage Input Element\": %f, ",catcher[16]);
		printf("\r\n\"CH1 CT Full Scale Rating\": %f, ",reform_uint16_2_float32(catcher[17],catcher[18]));			
		printf("\r\n\"CH1 CT Voltage Reference\": %f, ",catcher[19]);
		printf("\r\n\"CH1 CT Multiplier\": %f, ",reform_uint16_2_float32(catcher[20],catcher[21]));			
		printf("\r\n\"CH1 CT Type\": %f, ",catcher[22]);
		printf("\r\n\"CH1 CT Phase Shift\": %f, ",reform_uint16_2_float32(catcher[23],catcher[24]));			
		printf("\r\n\"CH1 CT Sign\": %f, ",catcher[25]);
		printf("\r\n\"CH2 CT Full Scale Rating\": %f, ",reform_uint16_2_float32(catcher[26],catcher[27]));			
		printf("\r\n\"CH2 CT Voltage Reference\": %f, ",catcher[28]);
		printf("\r\n\"CH2 CT Multiplier\": %f, ",reform_uint16_2_float32(catcher[29],catcher[30]));			
		printf("\r\n\"CH2 CT Type\": %f, ",catcher[31]);
		printf("\r\n\"CH2 CT Phase Shift\": %f, ",reform_uint16_2_float32(catcher[32],catcher[33]));			
		printf("\r\n\"CH2 CT Sign\": %f, ",catcher[34]);
		printf("\r\n\"CH3 CT Full Scale Rating\": %f, ",reform_uint16_2_float32(catcher[35],catcher[36]));			
		printf("\r\n\"CH3 CT Voltage Reference\": %f, ",catcher[37]);
		printf("\r\n\"CH3 CT Multiplier\": %f, ",reform_uint16_2_float32(catcher[38],catcher[39]));			
		printf("\r\n\"CH3 CT Type\": %f, ",catcher[40]);
		printf("\r\n\"CH3 CT Phase Shift\": %f, ",reform_uint16_2_float32(catcher[41],catcher[42]));			
		printf("\r\n\"CH3 CT Sign\": %f, ",catcher[43]);

	} else {
		iReturn = EX_DATAERR; /* 65 data format error *//* data format error */
	}

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
