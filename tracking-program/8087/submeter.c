/**
 * Reads data from an Eastron SDM630MCT meter via Modbus RTU.
 *
 * This version reads the instantaneous registers for Amps and Power
 * directly from the meter and performs no other data manipulation.
 *
 * To compile:
 * gcc submeter.c -o submeter `pkg-config --cflags --libs libmodbus`
 **/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/time.h>
#include <sysexits.h>
#include <errno.h>
#include <modbus/modbus.h>

#define SERVER_ID 1

// Helper function to convert two 16-bit registers to a 32-bit float
float reform_uint16_2_float32(uint16_t u1, uint16_t u2) {
    uint32_t num = ((uint32_t)u1 & 0xFFFF) << 16 | ((uint32_t)u2 & 0xFFFF);
    float numf;
    memcpy(&numf, &num, sizeof(float));
    return numf;
}

int main(int argc, char *argv[]) {
    modbus_t *sdm630;
    time_t now;
    time(&now);

    sdm630 = modbus_new_rtu("/dev/ttyUSB0", 9600, 'N', 8, 1);
    if (sdm630 == NULL) { return EX_UNAVAILABLE; }

    modbus_set_slave(sdm630, SERVER_ID);
    struct timeval response_timeout;
    response_timeout.tv_sec = 2; response_timeout.tv_usec = 0;
    modbus_set_response_timeout(sdm630, &response_timeout);

    if (modbus_connect(sdm630) == -1) { modbus_free(sdm630); return EX_IOERR; }

    // Read all required blocks of data
    uint16_t regs_main[76];
    int rc1 = modbus_read_input_registers(sdm630, 0x0000, 76, regs_main);
    uint16_t regs_config[76];
    int rc2 = modbus_read_input_registers(sdm630, 0x00C8, 76, regs_config);
    uint16_t regs_energy[16];
    int rc3 = modbus_read_input_registers(sdm630, 0x0156, 16, regs_energy);

    if (rc1 < 0 || rc2 < 0 || rc3 < 0) {
        fprintf(stderr, "Failed to read Modbus data: %s\n", modbus_strerror(errno));
        modbus_close(sdm630);
        modbus_free(sdm630);
        return EX_DATAERR;
    }
    
    // --- Get Raw Instantaneous Values ---
    float l1_amps = reform_uint16_2_float32(regs_main[6], regs_main[7]);   // 0x0006
    float l2_amps = reform_uint16_2_float32(regs_main[8], regs_main[9]);   // 0x0008
    float l3_amps = reform_uint16_2_float32(regs_main[10], regs_main[11]); // 0x000A

    float l1_kw = reform_uint16_2_float32(regs_main[12], regs_main[13]);   // 0x000C
    float l2_kw = reform_uint16_2_float32(regs_main[14], regs_main[15]);   // 0x000E
    float l3_kw = reform_uint16_2_float32(regs_main[16], regs_main[17]);   // 0x0010

    float l1_kva = reform_uint16_2_float32(regs_main[18], regs_main[19]);  // 0x0012
    float l2_kva = reform_uint16_2_float32(regs_main[20], regs_main[21]);  // 0x0014
    float l3_kva = reform_uint16_2_float32(regs_main[22], regs_main[23]);  // 0x0016

    float l1_kvar = reform_uint16_2_float32(regs_main[24], regs_main[25]); // 0x0018
    float l2_kvar = reform_uint16_2_float32(regs_main[26], regs_main[27]); // 0x001A
    float l3_kvar = reform_uint16_2_float32(regs_main[28], regs_main[29]); // 0x001C

    // --- Print Final JSON Output ---
    printf("{");
    printf("\"1144\": %.3f, ", l1_amps);
    printf("\"1146\": %.3f, ", l2_amps);
    printf("\"1148\": %.3f, ", l3_amps);
    printf("\"1170\": %.3f, ", l1_kw);
    printf("\"1172\": %.3f, ", l2_kw);
    printf("\"1174\": %.3f, ", l3_kw);
    printf("\"1178\": %.3f, ", l1_kva / 1000.0);
    printf("\"1180\": %.3f, ", l2_kva / 1000.0);
    printf("\"1182\": %.3f, ", l3_kva / 1000.0);
    printf("\"1186\": %.3f, ", l1_kvar / 1000.0);
    printf("\"1188\": %.3f, ", l2_kvar / 1000.0);
    printf("\"1190\": %.3f, ", l3_kvar / 1000.0);

    // Print other values (instantaneous PF, Voltage, THD, Energy)
    printf("\"1194\": %.3f, ", reform_uint16_2_float32(regs_main[30], regs_main[31]));
    printf("\"1196\": %.3f, ", reform_uint16_2_float32(regs_main[32], regs_main[33]));
    printf("\"1198\": %.3f, ", reform_uint16_2_float32(regs_main[34], regs_main[35]));
    printf("\"1160\": %.2f, ", reform_uint16_2_float32(regs_config[0], regs_config[1]));
    printf("\"1162\": %.2f, ", reform_uint16_2_float32(regs_config[2], regs_config[3]));
    printf("\"1164\": %.2f, ", reform_uint16_2_float32(regs_config[4], regs_config[5]));
    printf("\"9001\": %.2f, ", reform_uint16_2_float32(regs_config[34], regs_config[35]));
    printf("\"9002\": %.2f, ", reform_uint16_2_float32(regs_config[36], regs_config[37]));
    printf("\"9003\": %.2f, ", reform_uint16_2_float32(regs_config[38], regs_config[39]));
    printf("\"7000\": %.2f, ", reform_uint16_2_float32(regs_energy[0], regs_energy[1]));
    printf("\"7001\": %.2f, ", reform_uint16_2_float32(regs_energy[2], regs_energy[3]));
    printf("\"7002\": %.2f, ", reform_uint16_2_float32(regs_energy[4], regs_energy[5]));
    printf("\"7003\": %.2f, ", reform_uint16_2_float32(regs_energy[6], regs_energy[7]));
    printf("\"7004\": %.2f, ", reform_uint16_2_float32(regs_energy[8], regs_energy[9]));
    printf("\"7005\": %.2f, ", reform_uint16_2_float32(regs_energy[10], regs_energy[11]));
    printf("\"7006\": %.2f, ", reform_uint16_2_float32(regs_energy[12], regs_energy[13]));
    printf("\"7007\": %.2f, ", reform_uint16_2_float32(regs_energy[14], regs_energy[15]));
    
    printf("\"recordedAt\": %ld, ", (long)now);
    char *cmd = "od -x /dev/urandom | head -1 | awk '{OFS=\"-\"; print $2$3,$4,$5,$6,$7$8$9}'";
    char id_buf[64];
    FILE *fp = popen(cmd, "r");
    if (fp != NULL && fgets(id_buf, sizeof(id_buf), fp) != NULL) {
        id_buf[strcspn(id_buf, "\n")] = 0;
        printf("\"id\": \"%s\"}", id_buf);
    } else {
        printf("\"id\": \"generation-error\"}");
    }
    if (fp) pclose(fp);

    printf("\n");
    modbus_close(sdm630);
    modbus_free(sdm630);
    return 0;
}
