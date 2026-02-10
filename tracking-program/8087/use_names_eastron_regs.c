/**
 * Reads Input & Holding Registers from an Eastron SDM630MCT-V2 meter
 * via Modbus RTU based on the V2 protocol document:
 * https://xn--stromzhler-v5a.eu/media/02/11/b7/1696582673/sdm630-mct-v2-manual-incl-protocoll.pdf
 *
 * This version reads all V2-specific registers and provides
 * human-readable output.
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
#include <stdint.h> // Included for uint16_t, uint32_t
#include <unistd.h> // Included for usleep()
#include <math.h>   // Included for roundf

// --- Register Block Definitions (SDM630MCT V2) ---
// All values are 2 registers (32-bit float) unless noted

// Block 1: 0x0000 - 0x005E (Main Measurements)
#define B1_START 0x0000
#define B1_LAST_VAL_ADDR 0x005E
#define B1_COUNT (B1_LAST_VAL_ADDR - B1_START + 2) // 96 registers

// Block 2: 0x00F8 - 0x0146 (THD & Demand)
// Note: PDF splits these, but they are one continuous block.
#define B2_START 0x00F8
#define B2_LAST_VAL_ADDR 0x0146
#define B2_COUNT (B2_LAST_VAL_ADDR - B2_START + 2) // 80 registers

// Block H: 0x0000 - 0x004E (Holding Registers)
#define BH_START 0x0000
#define BH_LAST_VAL_ADDR 0x004E // Last value is 16-bit
#define BH_COUNT (BH_LAST_VAL_ADDR - BH_START + 1) // 79 registers


#define SERVER_ID 1

// Helper function to convert two 16-bit registers to a 32-bit float
float reform_uint16_2_float32(uint16_t u1, uint16_t u2) {
    uint32_t num = ((uint32_t)u1 & 0xFFFF) << 16 | ((uint32_t)u2 & 0xFFFF);
    float numf;
    memcpy(&numf, &num, sizeof(float));
    return numf;
}

// Helper function to get INPUT register name from its address (V2 Manual)
const char* get_register_name(int address) {
    switch (address) {
        // Block 1 (V2)
        case 0x0000: return "L1 Voltage";
        case 0x0002: return "L2 Voltage";
        case 0x0004: return "L3 Voltage";
        case 0x0006: return "L1 Current";
        case 0x0008: return "L2 Current";
        case 0x000A: return "L3 Current";
        case 0x000C: return "L1 Active Power";
        case 0x000E: return "L2 Active Power";
        case 0x0010: return "L3 Active Power";
        case 0x0012: return "L1 Apparent Power";
        case 0x0014: return "L2 Apparent Power";
        case 0x0016: return "L3 Apparent Power";
        case 0x0018: return "L1 Reactive Power";
        case 0x001A: return "L2 Reactive Power";
        case 0x001C: return "L3 Reactive Power";
        case 0x001E: return "L1 Power Factor";
        case 0x0020: return "L2 Power Factor";
        case 0x0022: return "L3 Power Factor";
        case 0x0024: return "L1 Phase Angle";
        case 0x0026: return "L2 Phase Angle";
        case 0x0028: return "L3 Phase Angle";
        case 0x002A: return "L1-L2 Voltage";
        case 0x002C: return "L2-L3 Voltage";
        case 0x002E: return "L3-L1 Voltage";
        case 0x0030: return "Average L-L Voltage";
        case 0x0032: return "Average L-N Voltage";
        case 0x0034: return "Total Active Power";
        case 0x0036: return "Total Apparent Power";
        case 0x0038: return "Total Reactive Power";
        case 0x003A: return "Total Power Factor";
        case 0x003C: return "Total Phase Angle";
        case 0x003E: return "Average Current (L1,L2,L3)";
        case 0x0040: return "Sum of Currents";
        case 0x0046: return "Frequency";
        case 0x0048: return "Total Active Energy";
        case 0x004A: return "Total Reactive Energy";
        case 0x004C: return "L1 Total Active Energy";
        case 0x004E: return "L2 Total Active Energy";
        case 0x0050: return "L3 Total Active Energy";
        case 0x0052: return "L1 Total Reactive Energy";
        case 0x0054: return "L2 Total Reactive Energy";
        case 0x0056: return "L3 Total Reactive Energy";
        case 0x005E: return "Neutral Current";

        // Block 2: THD (V2)
        case 0x00F8: return "L1 Voltage THD";
        case 0x00FA: return "L2 Voltage THD";
        case 0x00FC: return "L3 Voltage THD";
        case 0x00FE: return "Average Voltage THD";
        case 0x0108: return "L1 Current THD";
        case 0x010A: return "L2 Current THD";
        case 0x010C: return "L3 Current THD";
        case 0x010E: return "Average Current THD";
        case 0x0138: return "L1 Active Power THD";
        case 0x013A: return "L2 Active Power THD";
        case 0x013C: return "L3 Active Power THD";
        case 0x013E: return "Total Active Power THD";
        case 0x0140: return "L1 Apparent Power THD";
        case 0x0142: return "L2 Apparent Power THD";
        case 0x0144: return "L3 Apparent Power THD";
        case 0x0146: return "Total Apparent Power THD";
        
        // Block 2: Demand (V2)
        case 0x0100: return "Total Active Power Demand";
        case 0x0102: return "Total Reactive Power Demand";
        case 0x0104: return "Total Apparent Power Demand";
        case 0x0106: return "Average Current Demand";

        default:
            return "Unknown Register";
    }
}

// --- Helper functions for translating Holding Register codes (V2) ---

const char* get_baud_rate(uint16_t code) {
    switch (code) {
        case 0: return "2400";
        case 1: return "4800";
        case 2: return "9600";
        case 3: return "19200";
        case 4: return "38400";
        default: return "Unknown Code";
    }
}

const char* get_parity(uint16_t code) {
    switch (code) {
        case 0: return "NONE";
        case 1: return "ODD";
        case 2: return "EVEN";
        default: return "Unknown Code";
    }
}

const char* get_stop_bit(uint16_t code) {
    switch (code) {
        case 0: return "1";
        case 1: return "2";
        default: return "Unknown Code";
    }
}

// Helper function to get HOLDING register name from its address (V2)
const char* get_holding_register_name(int address) {
    switch (address) {
        // 16-bit Ints
        case 0x0000: return "Baud rate";
        case 0x0002: return "Parity";
        case 0x0004: return "Stop bit";
        case 0x002E: return "Demand time";
        case 0x003A: return "Clear min values";
        case 0x003C: return "Clear max values";
        case 0x004A: return "Pulse 1 output";
        case 0x004C: return "Pulse 1 width";
        case 0x004E: return "Password";

        // 32-bit Floats
        case 0x0006: return "Slave ID";
        case 0x000A: return "Measurement system selection";
        case 0x000C: return "CT rate 2";
        case 0x0012: return "CT rate 1";
        case 0x001A: return "PT rate 1";
        case 0x0022: return "PT rate 2";

        default: return "Unknown Holding Register";
    }
}


int main(int argc, char *argv[]) {
    modbus_t *sdm630;
    time_t now;
    time(&now);

    sdm630 = modbus_new_rtu("/dev/ttyUSB0", 9600, 'N', 8, 1);
    if (sdm630 == NULL) {
        fprintf(stderr, "Failed to create Modbus context\n");
        return EX_UNAVAILABLE;
    }

    modbus_set_slave(sdm630, SERVER_ID);
    struct timeval response_timeout;
    response_timeout.tv_sec = 2;
    response_timeout.tv_usec = 0;
    modbus_set_response_timeout(sdm630, &response_timeout);

    if (modbus_connect(sdm630) == -1) {
        fprintf(stderr, "Modbus connection failed: %s\n", modbus_strerror(errno));
        modbus_free(sdm630);
        return EX_IOERR;
    }

    // Allocate memory for all register blocks
    uint16_t regs_b1[B1_COUNT];
    uint16_t regs_b2[B2_COUNT]; // THD and Demand block
    uint16_t regs_bh[BH_COUNT]; // Holding Registers

    // Read all blocks of data
    int rc1 = modbus_read_input_registers(sdm630, B1_START, B1_COUNT, regs_b1);
    usleep(200000); // Wait 200ms
    int rc2 = modbus_read_input_registers(sdm630, B2_START, B2_COUNT, regs_b2);
    usleep(200000); // Wait 200ms
    int rc_h = modbus_read_registers(sdm630, BH_START, BH_COUNT, regs_bh);


    if (rc1 < 0 || rc2 < 0 || rc_h < 0) {
        fprintf(stderr, "Failed to read Modbus data: %s\n", modbus_strerror(errno));
        fprintf(stderr, "Read codes: B1=%d, B2=%d, BH=%d\n", rc1, rc2, rc_h);
        modbus_close(sdm630);
        modbus_free(sdm630);
        return EX_DATAERR;
    }

    // --- Define explicit address lists for each block (V2 Manual) ---
    
    // Block 1 Addresses: 0x0000 - 0x005E
    int b1_addrs[] = {
        0x0000, 0x0002, 0x0004, 0x0006, 0x0008, 0x000A, 0x000C, 0x000E, 0x0010, 0x0012,
        0x0014, 0x0016, 0x0018, 0x001A, 0x001C, 0x001E, 0x0020, 0x0022, 0x0024, 0x0026,
        0x0028, 0x002A, 0x002C, 0x002E, 0x0030, 0x0032, 0x0034, 0x0036, 0x0038, 0x003A,
        0x003C, 0x003E, 0x0040, 0x0046, 0x0048, 0x004A, 0x004C, 0x004E, 0x0050, 0x0052,
        0x0054, 0x0056, 0x005E
    };
    int b1_addr_count = sizeof(b1_addrs) / sizeof(b1_addrs[0]);

    // Block 2: THD Addresses (0x00F8 - 0x0146)
    int b2_thd_addrs[] = {
        0x00F8, 0x00FA, 0x00FC, 0x00FE, 0x0108, 0x010A, 0x010C, 0x010E,
        0x0138, 0x013A, 0x013C, 0x013E, 0x0140, 0x0142, 0x0144, 0x0146
    };
    int b2_thd_addr_count = sizeof(b2_thd_addrs) / sizeof(b2_thd_addrs[0]);

    // Block 2: Demand Addresses (0x0100 - 0x0106)
    int b2_demand_addrs[] = {
        0x0100, 0x0102, 0x0104, 0x0106
    };
    int b2_demand_addr_count = sizeof(b2_demand_addrs) / sizeof(b2_demand_addrs[0]);


    // Block H (Holding) Addresses: 0x0000 - 0x004E
    // These are 16-bit unsigned ints
    int bh_addrs_uint16[] = {
        0x0000, 0x0002, 0x0004, 0x002E, 0x003A, 
        0x003C, 0x004A, 0x004C, 0x004E
    };
    int bh_uint16_count = sizeof(bh_addrs_uint16) / sizeof(bh_addrs_uint16[0]);

    // These are 32-bit floats
    int bh_addrs_float[] = {
        0x0006, 0x000A, 0x000C, 0x0012, 0x001A, 0x0022
    };
    int bh_float_count = sizeof(bh_addrs_float) / sizeof(bh_addrs_float[0]);


    // --- Print Final Output ---
    
    printf("--- Block 1: Measurements (V2) ---\n");
    if (rc1 < 0) {
        printf("Failed to read Block 1.\n");
    } else {
        for (int i = 0; i < b1_addr_count; i++) {
            int addr = b1_addrs[i];
            int offset = addr - B1_START;
            printf("%s (0x%04X): %.3f\n", get_register_name(addr), addr, reform_uint16_2_float32(regs_b1[offset], regs_b1[offset + 1]));
        }
    }


    printf("\n--- Block 2: THD (V2) ---\n");
    if (rc2 < 0) {
        printf("Failed to read Block 2.\n");
    } else {
        for (int i = 0; i < b2_thd_addr_count; i++) {
            int addr = b2_thd_addrs[i];
            int offset = addr - B2_START;
            printf("%s (0x%04X): %.3f\n", get_register_name(addr), addr, reform_uint16_2_float32(regs_b2[offset], regs_b2[offset + 1]));
        }
    }

    printf("\n--- Block 2: Demand (V2) ---\n");
    if (rc2 < 0) {
        printf("Failed to read Block 2.\n");
    } else {
        for (int i = 0; i < b2_demand_addr_count; i++) {
            int addr = b2_demand_addrs[i];
            int offset = addr - B2_START;
            printf("%s (0x%04X): %.3f\n", get_register_name(addr), addr, reform_uint16_2_float32(regs_b2[offset], regs_b2[offset + 1]));
        }
    }

    // --- Print Block H: Holding Registers ---
    printf("\n--- Block H: Holding Registers (V2) ---\n");
    if (rc_h < 0) {
        printf("Failed to read holding registers.\n");
    } else {
        printf("--- Holding Registers (16-bit Ints) ---\n");
        for (int i = 0; i < bh_uint16_count; i++) {
            int addr = bh_addrs_uint16[i];
            int offset = addr - BH_START;
            uint16_t val = regs_bh[offset];
            const char* name = get_holding_register_name(addr);
            
            printf("%s (0x%04X): ", name, addr);

            // Print the interpreted value
            if (addr == 0x0000) {
                printf("%s (Code: %u)\n", get_baud_rate(val), val);
            } else if (addr == 0x0002) {
                printf("%s (Code: %u)\n", get_parity(val), val);
            } else if (addr == 0x0004) {
                printf("%s (Code: %u)\n", get_stop_bit(val), val);
            } else {
                 // For values like 'Demand time', 'Password', etc.
                 printf("%u\n", val);
            }
        }

        printf("\n--- Holding Registers (32-bit Floats) ---\n");
        for (int i = 0; i < bh_float_count; i++) {
            int addr = bh_addrs_float[i];
            int offset = addr - BH_START;
            const char* name = get_holding_register_name(addr);
            // Get the float value
            float val_f = reform_uint16_2_float32(regs_bh[offset], regs_bh[offset + 1]);
            
            printf("%s (0x%04X): ", name, addr);

            if (addr == 0x000A) { // Measurement system selection
                // User says: 3p4w = 3, 3p3w = 2, 1p2w = 1
                int val_int = (int)roundf(val_f); // Round to nearest integer
                if (val_int == 3) {
                    printf("3P4W (Code: %.1f)\n", val_f);
                } else if (val_int == 2) {
                    printf("3P3W (Code: %.1f)\n", val_f);
                } else if (val_int == 1) {
                    printf("1P2W (Code: %.1f)\n", val_f);
                } else {
                    printf("Unknown System (Code: %.1f)\n", val_f);
                }
            } else if (addr == 0x0006) { // Slave ID
                int val_int = (int)roundf(val_f); // Round to nearest integer
                if (val_int < 1 || val_int > 247) {
                     printf("%.1f [WARN: Invalid Slave ID, expected 1-247]\n", val_f);
                } else {
                     printf("%.0f\n", val_f); // Print as whole number
                }
            } else {
                // Default float printing for CT/PT rates
                printf("%.3f\n", val_f);
            }
        }
    }

    // --- Add Timestamp and unique ID ---
    printf("\n--- System Info ---\n");
    printf("RecordedAt: %ld\n", (long)now);

    char *cmd = "od -x /dev/urandom | head -1 | awk '{OFS=\"-\"; print $2$3,$4,$5,$6,$7$8$9}'";
    char id_buf[64];
    FILE *fp = popen(cmd, "r");
    if (fp != NULL && fgets(id_buf, sizeof(id_buf), fp) != NULL) {
        id_buf[strcspn(id_buf, "\n")] = 0; // Remove trailing newline
        printf("id: %s\n", id_buf);
    } else {
        printf("id: generation-error\n");
    }
    if (fp) pclose(fp);

    printf("\n"); // Add final newline for clean output
    
    modbus_close(sdm630);
    modbus_free(sdm630);
    return 0;
}


