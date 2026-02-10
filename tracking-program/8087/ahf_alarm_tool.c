#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <errno.h>
#include <time.h>
#include <modbus.h>

/* * AHF Alarm Tool - Multi-Strategy Scanner & Resetter
 * --------------------------------------------------
 * Logic adapted from powerfiltermeter.c (Baud 19200)
 *
 * Compile: 
 * gcc ahf_alarm_tool.c -o ahf_alarm_tool $(pkg-config --cflags --libs libmodbus)
 *
 * Usage:
 * ./ahf_alarm_tool scan
 * ./ahf_alarm_tool reset
 * ./ahf_alarm_tool on
 * ./ahf_alarm_tool off
 */

// --- Configuration ---
#define DEVICE "/dev/ttyUSB0"
#define BAUD 19200   // Updated to match powerfiltermeter.c
#define PARITY 'N'
#define DATA_BIT 8
#define STOP_BIT 1
#define SLAVE_ID 1

// Reset Configuration 
// Manufacturer Spec: 01 05 00 08 FF 00 (Write Coil 8 => ON)
#define RESET_COIL_ADDR 8

// Power Switch Configuration
// Manufacturer Spec: 01 05 00 09 ... (Write Coil 9)
#define SWITCH_COIL_ADDR 9

const char *ALARM_NAMES[] = {
    "Switch Power Fault",       // 01
    "Fan Fault",                // 02
    "Grid Over Voltage",        // 03
    "DC Under Voltage",         // 04
    "Grid Under Voltage",       // 05
    "Frequency Abnormal",       // 06
    "Over Temperature",         // 07
    "FPGA/Hardware Fault",      // 08
    "Inst. Over Current (C)",   // 09
    "Inst. Over Current (B)",   // 10
    "Inst. Over Current (A)",   // 11
    "DC Over Voltage",          // 12
    "Delayed Over Current (C)", // 13
    "Delayed Over Current (B)", // 14
    "Delayed Over Current (A)", // 15
    "DC Neutral Point Fault"    // 16
};

// --- Connection Helper (Based on powerfiltermeter.c) ---
modbus_t* setup_connection() {
    modbus_t *ctx = modbus_new_rtu(DEVICE, BAUD, PARITY, DATA_BIT, STOP_BIT);
    if (ctx == NULL) {
        fprintf(stderr, "Unable to allocate libmodbus context\n");
        return NULL;
    }
    
    modbus_set_slave(ctx, SLAVE_ID);
    
    // CHANGED: Enable Debug to see raw HEX bytes
    modbus_set_debug(ctx, TRUE);
    
    // Removed explicit timeout to match powerfiltermeter.c logic
    // and avoid version conflicts.
    
    if (modbus_connect(ctx) == -1) {
        fprintf(stderr, "Connection failed: %s\n", modbus_strerror(errno));
        modbus_free(ctx);
        return NULL;
    }
    return ctx;
}

void perform_reset() {
    modbus_t *ctx = setup_connection();
    if (!ctx) return;

    printf("--- Sending Module Reset Command (Func 05, Coil %d) ---\n", RESET_COIL_ADDR);
    
    // Manufacturer specified 0x01 0x05 ... which is "Write Single Coil"
    // modbus_write_bit sends Function 05. 
    // TRUE sends 0xFF00 (Force ON).
    int rc = modbus_write_bit(ctx, RESET_COIL_ADDR, TRUE);
    
    if (rc == -1) {
        fprintf(stderr, "Reset command failed: %s\n", modbus_strerror(errno));
    } else {
        printf("Reset command sent successfully (0x05 Write Coil).\n");
    }

    modbus_close(ctx);
    modbus_free(ctx);
}

void perform_switch(int turn_on) {
    modbus_t *ctx = setup_connection();
    if (!ctx) return;

    if (turn_on) {
        printf("--- Sending Switch ON Command (Func 05, Coil %d) ---\n", SWITCH_COIL_ADDR);
        // TRUE sends 0xFF00 (Force ON)
        int rc = modbus_write_bit(ctx, SWITCH_COIL_ADDR, TRUE);
        if (rc == -1) {
            fprintf(stderr, "Switch ON failed: %s\n", modbus_strerror(errno));
        } else {
            printf("Switch ON command sent successfully.\n");
        }
    } else {
        printf("--- Sending Switch OFF Command (Func 05, Coil %d) ---\n", SWITCH_COIL_ADDR);
        // FALSE sends 0x0000 (Force OFF)
        int rc = modbus_write_bit(ctx, SWITCH_COIL_ADDR, FALSE);
        if (rc == -1) {
            fprintf(stderr, "Switch OFF failed: %s\n", modbus_strerror(errno));
        } else {
            printf("Switch OFF command sent successfully.\n");
        }
    }

    modbus_close(ctx);
    modbus_free(ctx);
}

void perform_scan() {
    modbus_t *ctx = setup_connection();
    if (!ctx) return;

    uint8_t bits[16]; // Only reading 16 bits as per command 0x10
    int rc;

    printf("--- STARTING ALARM SCAN (Manufacturer Spec) ---\n");
    printf("Command: 01 02 00 00 00 10 ...\n\n");

    // MANUFACTURER SPECIFIC READ
    // Function 02 (Read Input Bits), Address 0, Count 16
    rc = modbus_read_input_bits(ctx, 0, 16, bits);
    
    if (rc == -1) {
        printf("  -> Read Failed: %s\n", modbus_strerror(errno)); 
    } else {
        int alarm_found = 0;
        for (int i=0; i < rc; i++) {
            // bits[i] is typically uint8_t 1 or 0
            if (bits[i]) {
                printf("  [ALARM ACTIVE] Bit %d: %s\n", i, ALARM_NAMES[i]);
                alarm_found = 1;
            }
        }
        
        if (!alarm_found) {
            printf("  [OK] No active alarms detected.\n");
        }
    }

    printf("\n--- SCAN COMPLETE ---\n");

    modbus_close(ctx);
    modbus_free(ctx);
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Usage: %s [scan|reset|on|off]\n", argv[0]);
        return 0;
    }

    if (strcmp(argv[1], "scan") == 0) {
        perform_scan();
    } else if (strcmp(argv[1], "reset") == 0) {
        perform_reset();
    } else if (strcmp(argv[1], "on") == 0) {
        perform_switch(1);
    } else if (strcmp(argv[1], "off") == 0) {
        perform_switch(0);
    } else {
        printf("Unknown command: %s\n", argv[1]);
    }

    return 0;
}
