/**
 * modify_APF_batch.c
 *
 * A utility to batch write a specific set of parameters to an Active Power Filter (APF).
 *
 * This version HARDCODES the register list provided by the user.
 * It iterates through the list, converting 1-based addresses to 0-based,
 * and writes the decimal values via Modbus RTU.
 *
 * Compile with:
 * gcc modify_APF_batch.c -o modify_APF_batch `pkg-config --cflags --libs libmodbus`
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h> // For usleep if needed
#include <modbus/modbus.h>
#include <errno.h>

#define SERVER_ID 1

// Structure to hold our register/value pairs
typedef struct {
    int reg;   // 1-based register address
    int value; // Decimal value to write
} apf_setting;

int main(void) {
    // Defines the list of parameters to write based on user request
    apf_setting settings_to_write[] = {
        {9, 2},
        {10, 4},
        {11, 3},
        {12, 0},
        {13, 0},
        {14, 0},
        {27, 0},
        {28, 0},
        {29, 2},
        {30, 0},
        {31, 3},
        {32, 5},
        {33, 7},
        {34, 9},
        {35, 11},
        {36, 13},
        {37, 15},
        {38, 17},
        {39, 2},
        {40, 4},
        {41, 200}, // Using 200 decimal (0xC8), ignoring the conflicting hex in prompt
        {42, 0},
        {43, 0},
        {44, 0},
        {64, 140}  // Using 140 decimal
    };

    int num_settings = sizeof(settings_to_write) / sizeof(settings_to_write[0]);

    modbus_t *ctx;

    // --- Initialize Modbus RTU connection ---
    // Double check your USB port: /dev/ttyUSB0 or /dev/ttyUSB1
    ctx = modbus_new_rtu("/dev/ttyUSB0", 19200, 'N', 8, 1);
    if (ctx == NULL) {
        fprintf(stderr, "Unable to allocate libmodbus context\n");
        return -1;
    }

    modbus_set_debug(ctx, TRUE);
    modbus_set_slave(ctx, SERVER_ID);

    if (modbus_connect(ctx) == -1) {
        fprintf(stderr, "Connection failed: %s\n", modbus_strerror(errno));
        modbus_free(ctx);
        return -1;
    }

    printf("--- Device Connected ---\n");

    // --- Unlock device ---
    printf("--- Unlocking device ---\n");
    // Writing 0x2481 to Register 46 (0x2E)
    if (modbus_write_register(ctx, 0x002E, 0x2481) == 1) {
        printf("UNLOCKED successfully.\n");
    } else {
        fprintf(stderr, "FAILED TO UNLOCK: %s\n", modbus_strerror(errno));
        // We typically continue even if unlock fails, in case it was already unlocked,
        // but be aware writes might fail if this didn't work.
    }

    // --- Batch Write Loop ---
    printf("\n--- Starting Batch Write (%d registers) ---\n", num_settings);

    int failures = 0;

    for (int i = 0; i < num_settings; i++) {
        int reg_1based = settings_to_write[i].reg;
        int value = settings_to_write[i].value;

        // Convert 1-based to 0-based for Modbus protocol
        int addr_0based = reg_1based - 1;

        printf("Writing Decimal %d to Register %d (Addr 0x%04X)... ", value, reg_1based, addr_0based);

        if (modbus_write_register(ctx, addr_0based, value) == 1) {
            printf("OK\n");
        } else {
            printf("FAILED (%s)\n", modbus_strerror(errno));
            failures++;
        }
        
        // Optional: slight delay to prevent flooding if the device is slow
        // usleep(10000); // 10ms
    }

    printf("\nBatch write finished with %d failures.\n", failures);

    // --- Verification Read ---
    printf("\n--- Reading back registers for verification ---\n");
    // Reading 67 registers covers the range 1 to 67
    uint16_t tab_reg[67];
    int num_read = modbus_read_registers(ctx, 0x0000, 67, tab_reg);

    if (num_read > 0) {
        // Iterate only through the registers we intended to change to verify them specifically
        printf("\n%-10s %-10s %-10s %-10s\n", "Register", "Expected", "Actual", "Status");
        printf("---------------------------------------------\n");
        
        for (int i = 0; i < num_settings; i++) {
            int reg_idx = settings_to_write[i].reg - 1; // 0-based index for array access
            int expected = settings_to_write[i].value;
            int actual = tab_reg[reg_idx];

            const char *status = (expected == actual) ? "MATCH" : "MISMATCH";
            
            printf("Reg %-6d %-10d %-10d %s\n", 
                   settings_to_write[i].reg, 
                   expected, 
                   actual, 
                   status);
        }
        
        printf("\n(Full Dump Available if needed, but suppressed for clarity)\n");

    } else {
        fprintf(stderr, "Failed to read registers: %s\n", modbus_strerror(errno));
    }

    modbus_close(ctx);
    modbus_free(ctx);

    return 0;
}
