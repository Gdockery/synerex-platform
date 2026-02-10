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

	sdm630 = modbus_new_rtu("/dev/ttyUSB0", 19200, 'N', 8, 1);
	modbus_set_slave(sdm630, SERVER_ID);
	modbus_set_debug(sdm630, TRUE);
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
	char labels[79][30] = {
	   "A order load harmonic content",
	   "B order load harmonic content",
	   "C order load harmonic content",
	   "D order load harmonic content",
	   "E order load harmonic content",
	   "F order load harmonic content",
	   "G order load harmonic content",
	   "H order load harmonic content",
	   "I order load harmonic content",
	   "J order load harmonic content",
	   "K order load harmonic content",
	   "L order load harmonic content",
	   "M order load harmonic content",
	   "N order load harmonic content",
	   "O order load harmonic content",
	   "A order grid harmonic content",
	   "B order grid harmonic content",
	   "C order grid harmonic content",
	   "D order grid harmonic content",
	   "E order grid harmonic content",
	   "F order grid harmonic content",
	   "G order grid harmonic content",
	   "H order grid harmonic content",
	   "I order grid harmonic content",
	   "J order grid harmonic content",
	   "K order grid harmonic content",
	   "L order grid harmonic content",
	   "M order grid harmonic content",
	   "N order grid harmonic content",
	   "O order grid harmonic content",
	   "A phase grid voltage",
	   "B phase grid voltage",
	   "C phase grid voltage",
	   "A phase grid current",
	   "B phase grid current",
	   "C phase grid current",
	   "A phase load current",
	   "B phase load current",
	   "C phase load current",
	   "A phase output current",
	   "B phase output current",
	   "C phase output current",
	   "A phase load PF",
	   "B phase load PF",
	   "C phase load PF",
	   "A phase load Q",
	   "B phase load Q",
	   "C phase load Q",
	   "A phase grid PF",
	   "B phase grid PF",
	   "C phase grid PF",
	   "Max load current",
	   "DC side voltage",
	   "Neutral Point voltage",
	   "DC V Fluctuation",
	   "Neutral point V fluctuation",
	   "Grid Frequency",
	   "Temperature 1",
	   "Temperature 2",
	   "Temperature 3",
	   "Grid THDA",
	   "Grid THDB",
	   "Grid THDC",
	   "A phase load THD",
	   "B phase load THD",
	   "C phase load THD",
	   "A phase voltage THD",
	   "B phase voltage THD",
	   "C phase voltage THD",
	   "A phase load P",
	   "B phase load P",
	   "C phase load P",
	   "Load N line current",
	   "Grid N line current",
	   "N line compensation current",
	   "Program version",
	   "A grid P",
	   "B grid P",
	   "C grid P"
	};

	/*uint16_t turn_on_cmd[4];
	   turn_on_cmd[0] = 0x0105;
	   turn_on_cmd[1] = 0x0009;
	   turn_on_cmd[2] = 0xff00;
	   turn_on_cmd[3] = 0x5c38;
	
	uint16_t turn_off_cmd[4];
	   turn_off_cmd[0] = 0x0105;
	   turn_off_cmd[1] = 0x0009;
	   turn_off_cmd[2] = 0x0000;
	   turn_off_cmd[3] = 0x1dc8;
	*/uint16_t unlock[4];
	   unlock[0] = 0x0106; //read zone 4
	   unlock[1] = 0x002E; //start at this register (47)
	   unlock[2] = 0x2481; //write 9345
	   unlock[3] = 0x32A3; //checksum - modbus

	if (modbus_write_registers(sdm630, 0x0000, 4, unlock)) {
	   printf("UNLOCKED\r\n");
	   //printf("\"delay: \" %f\r\n",reform_uint16_2_float32(read_zone_4[0],read_zone_4[1]));
	} else {
	   printf("FAILED TO UNLOCK\r\n");
	}
	uint16_t reset_cmd[4];
	   reset_cmd[0] = 0x0105;
	   reset_cmd[1] = 0x000A;
	   reset_cmd[2] = 0xff00;
	   reset_cmd[3] = 0xAC38;
	/*uint16_t read_zone_4[4];
	   read_zone_4[0] = 0x0106; //read zone 4
	   // 
	   read_zone_4[1] = 0x002F; 
	   read_zone_4[2] = 0x0258; 
	   read_zone_4[3] = 0xB899;*/ 
	(modbus_write_registers(sdm630, 0x0000, 4, reset_cmd)) ?  printf("RESET SENT\r\n") : printf("FAIL");
	uint16_t* catcher = malloc(120*sizeof(uint16_t));
	int j = 0;
	if(modbus_read_registers(sdm630, 0x0000, 67, catcher)>0) {
	   for (int i = 0; i < 67; i++) {
	/*	if(i == 0) {
		  printf("zone 0\r\n"); j = 0;
		} if(i == 1) {
		  printf("zone 1\r\n"); j = 1;
		} if(i == 2) {
	*/	  if(i==0)printf("zone 3\r\n"); j = 2;
	/*	} if(i == 81) {
		  printf("zone 4\r\n"); j = 81;
		}
*/
	   	printf("register %d: %d (0x%x)\r\n",i+1,catcher[i],catcher[i]);
	   }
	   //printf("\"response: \" %f",reform_uint16_2_float32(catcher[0],catcher[1]));
	} else {
	   printf("no return");
	   iReturn = EX_DATAERR;
	}
	/*if(modbus_read_input_registers(sdm630, 0x0078, 120, catcher)>0) {
	   for (int i = 0; i < 30; i++) {
	   	printf("register %d: %d (0x%x)\r\n",i+121-j,(int16_t)catcher[i],catcher[i]);
	   }
	} else {
	   printf("no return2");
	   iReturn = EX_DATAERR;
	}*/	
	free(catcher);

/*	uint16_t* catcher2 = malloc(76*sizeof(uint16_t));
	if(modbus_read_input_registers(sdm630, 0x00C8, 76, catcher2)>0){			
		printf("\"1160\": %f, ",reform_uint16_2_float32(catcher2[0],catcher2[1]));
		printf("\"1162\": %f, ",reform_uint16_2_float32(catcher2[2],catcher2[3]));
		printf("\"1164\": %f, ",reform_uint16_2_float32(catcher2[4],catcher2[5]));
		printf("\"9001\": %f, ",reform_uint16_2_float32(catcher2[34],catcher2[35]));
		printf("\"9002\": %f, ",reform_uint16_2_float32(catcher2[36],catcher2[37]));
		printf("\"9003\": %f, ",reform_uint16_2_float32(catcher2[38],catcher2[39]));
		printf("\"9004\": %f, ",reform_uint16_2_float32(catcher2[40],catcher2[41]));
		printf("\"9005\": %f, ",reform_uint16_2_float32(catcher2[42],catcher2[43]));
		printf("\"9006\": %f, ",reform_uint16_2_float32(catcher2[44],catcher2[45]));
		printf("\"9007\": %f, ",reform_uint16_2_float32(catcher2[46],catcher2[47]));
		printf("\"9008\": %f, ",reform_uint16_2_float32(catcher2[48],catcher2[49]));
		printf("\"recordedAt\": %d, ",now);
	} else {
		iReturn = EX_DATAERR; // 65 data format error 
	}

	free(catcher2);*/
	
	modbus_close(sdm630);
	modbus_free(sdm630);

	/*if ((fp = popen(cmd, "r")) == NULL) {
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

*/
	return iReturn;
}
