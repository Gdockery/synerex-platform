#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sysexits.h>
#include <modbus/modbus.h>

#define SERVER_ID 1

int main(int argc, char *argv[]){
	modbus_t *sdm630;
	int iReturn = 0;

	sdm630 = modbus_new_rtu("/dev/ttyUSB0", 19200, 'N', 8, 1);
	modbus_set_slave(sdm630, SERVER_ID);
	modbus_set_debug(sdm630, TRUE);

	if (sdm630 == NULL) {
		fprintf(stderr, "Unable to allocate libmodbus context\n");
		return EX_IOERR;
	}
	if (modbus_connect(sdm630) == -1) {
		fprintf(stderr, "Connection failed: \n");
		modbus_free(sdm630);
		return EX_NOINPUT;
	}

	char *faults[16] = {
		"Switch power fault",
		"Fans fault",
		"Grid over voltage",
		"DC under voltage",
		"Grid under voltage",
		"Frequency problem",
		"Over temperature",
		"EFGA fault",
		"Instantaneous over current C phase",
		"Instantaneous over current B phase",
		"Instantaneous over current A phase",
		"DC over voltage",
		"Delayed over current C phase",
		"Delayed over current B phase",
		"Delayed over current A phase",
		"DC Neutral point"
	};

	uint16_t reg;
	if (modbus_read_registers(sdm630, 0, 1, &reg) == 1) {
		for (int b = 0; b < 16; b++) {
			if (reg & (1 << b)) {
				printf("%s: 1\n", faults[b]);
			} else {
				printf("%s: 0\n", faults[b]);
			}
		}
		if (reg == 0) {
			printf("No alarms active\n");
		}
	} else {
		printf("Read failed\n");
		iReturn = EX_DATAERR;
	}

	modbus_close(sdm630);
	modbus_free(sdm630);

	return iReturn;
}
