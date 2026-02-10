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

void float32_to_uint16(float value, uint16_t *u1, uint16_t *u2)
{
    uint32_t num;
    memcpy(&num, &value, 4);
    *u1 = (uint16_t)(num >> 16);
    *u2 = (uint16_t)(num & 0xFFFF);
}

int main(int argc, char *argv[]){
    modbus_t *sdm630;
    int iReturn = 0;
    time_t now;

    char *cmd = "od -x /dev/urandom | head -1 | awk '{OFS=\"-\"; print $2$3,$4,$5,$6,$7$8$9}'";
    char buf[128];
    FILE *fp;

    sdm630 = modbus_new_tcp("192.168.1.105", 502);
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
    
    uint16_t zero[2];
    zero[0] = 0;
    zero[1] = 0;

    if (modbus_write_registers(sdm630, 0x08B0, 2, zero)) {
        printf("UNLOCKED\r\n");
    } else {
        printf("FAILED TO UNLOCK\r\n");
    }
    if (modbus_write_registers(sdm630, 0x08B9, 2, zero)) {
        printf("UNLOCKED\r\n");
    } else {
        printf("FAILED TO UNLOCK\r\n");
    }
    if (modbus_write_registers(sdm630, 0x08C2, 2, zero)) {
        printf("UNLOCKED\r\n");
    } else {
        printf("FAILED TO UNLOCK\r\n");
    }

    float value = 4000.0;
    uint16_t float_regs[2];
    float32_to_uint16(value, &float_regs[0], &float_regs[1]);

    if (modbus_write_registers(sdm630, 0x08AA, 2, float_regs)) {
        printf("WROTE 4000 TO 2218-2219\r\n");
    } else {
        printf("FAILED TO WRITE 4000 TO 2218-2219\r\n");
    }
    if (modbus_write_registers(sdm630, 0x08B3, 2, float_regs)) {
        printf("WROTE 4000 TO 2227-2228\r\n");
    } else {
        printf("FAILED TO WRITE 4000 TO 2227-2228\r\n");
    }
    if (modbus_write_registers(sdm630, 0x08BC, 2, float_regs)) {
        printf("WROTE 4000 TO 2236-2237\r\n");
    } else {
        printf("FAILED TO WRITE 4000 TO 2236-2237\r\n");
    }

    return iReturn;
}
