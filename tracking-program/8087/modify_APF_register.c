/**
 * A utility to modify a register on an Active Power Filter (APF) device.
 *
 * This version takes a 1-based register address and a value as decimal strings.
 * It converts them to 16-bit integers for the Modbus command. The register
 * address is converted to be 0-based to match protocol requirements.
 * It uses the libmodbus library to handle the protocol details automatically.
 *
 * Compile with:
 * gcc modify_APF_register.c -o modify_APF_register `pkg-config --cflags --libs libmodbus`
 *
 * Example Usage:
 * ./modify_APF_register 51 50
 * (This will write the decimal value 50 to the device's register 51)
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sysexits.h>
#include <modbus/modbus.h>
#include <errno.h>

#define SERVER_ID 1

void print_help(const char *prog_name) {
    printf("Usage: %s <register_address> <value_to_write>\n\n", prog_name);
    printf("Writes a decimal value to a specific register on an APF device via Modbus RTU.\n\n");
    printf("Arguments:\n");
    printf("  <register_address>   The register number to write to (1-based decimal).\n");
    printf("                       This is based on the device documentation.\n");
    printf("  <value_to_write>     The decimal value to write to the register.\n\n");
    printf("Example:\n");
    printf("  %s 51 50\n", prog_name);
    printf("  This command writes the value 50 to register 51.\n\n");
    printf("-----------------------------------------------------------------\n");
    printf("Available Registers (Zone 4):\n");
    printf("-----------------------------------------------------------------\n");
    printf("  1: A order name              | 35: E order phase adjustment\n");
    printf("  2: B order name              | 36: F order phase adjustment\n");
    printf("  3: C order name              | 37: G order phase adjustment\n");
    printf("  4: D order name              | 38: H order phase adjustment\n");
    printf("  5: F order name              | 39: I order phase adjustment\n");
    printf("  6: F order name              | 40: J order phase adjustment\n");
    printf("  7: G order name              | 41: K order phase adjustment\n");
    printf("  8: H order name              | 42: L order phase adjustment\n");
    printf("  9: L order name              | 43: M order phase adjustment\n");
    printf(" 10: J order name              | 44: N order phase adjustment\n");
    printf(" 11: K order name              | 45: Phase Cc\n");
    printf(" 12: L order name              | 46: Mode(working mode)\n");
    printf(" 13: M order name              | 47: Waveform selection\n");
    printf(" 14: N order name              | 48: CT Ratio\n");
    printf(" 15: Target Q value            | 49: Module capacity\n");
    printf(" 16: A order ampli adjustment  | 50: Cabinet total capacity\n");
    printf(" 17: B order ampli adjustment  | 51: Total Current limit\n");
    printf(" 18: C order ampli adjustment  | 52: Voltage stabilization value\n");
    printf(" 19: D order ampli adjustment  | 53: SVG/APF Module address\n");
    printf(" 20: E order ampli adjustment  | 54: Target PF\n");
    printf(" 21: F order ampli adjustment  | 55: Over current threshold\n");
    printf(" 22: G order ampli adjustment  | 56: Over voltage threshold\n");
    printf(" 23: H order ampli adjustment  | 57: Under voltage threshold\n");
    printf(" 24: I order ampli adjustment  | 58: Neu point voltage threshold\n");
    printf(" 25: J order ampli adjustment  | 59: Instantaneous threshold value\n");
    printf(" 26: K order ampli adjustment  | 60: Temperature protection Threshold 1\n");
    printf(" 27: L order ampli adjustment  | 61: Temperature protection Threshold 2\n");
    printf(" 28: M order ampli adjustment  | 62: Unbalance coefficient\n");
    printf(" 29: N order ampli adjustment  | 63: Amplitude limiting priority\n");
    printf(" 30: KP/KI(reactive control)   | 64: Reserved 64\n");
    printf(" 31: A order phase adjustment  | 65: Reserved 65\n");
    printf(" 32: B order phase adjustment  | 66: CT position\n");
    printf(" 33: C order phase adjustment  | 67: Device 1 target Q2\n");
    printf(" 34: D order phase adjustment  |\n");
}

int main(int argc, char *argv[]) {
    // If incorrect number of arguments are supplied, print help and exit.
    if (argc != 3) {
        print_help(argv[0]);
        return EX_USAGE;
    }

    // --- Argument Parsing and Conversion ---
    // Convert ASCII decimal string for register to an integer and subtract 1 for 0-based index
    long reg_addr_long = strtol(argv[1], NULL, 10);
    uint16_t register_addr = (uint16_t)(reg_addr_long - 1);

    // Convert ASCII decimal string for value to an integer
    uint16_t register_val = (uint16_t)strtol(argv[2], NULL, 10);


    printf("--- Decimal to Hex Conversion ---\n");
    printf("Input Register (1-based): %ld -> %d (0x%04X) (0-based)\n", reg_addr_long, register_addr, register_addr);
    printf("Input Value: %d (0x%04X)\n", register_val, register_val);
    printf("---------------------------------\n\n");

    modbus_t *ctx;
    // Initialize Modbus RTU connection
    ctx = modbus_new_rtu("/dev/ttyUSB0", 19200, 'N', 8, 1);
    if (ctx == NULL) {
        fprintf(stderr, "Unable to allocate libmodbus context\n");
        return EX_IOERR;
    }

    modbus_set_debug(ctx, TRUE);
    modbus_set_slave(ctx, SERVER_ID);

    if (modbus_connect(ctx) == -1) {
        fprintf(stderr, "Connection failed: %s\n", modbus_strerror(errno));
        modbus_free(ctx);
        return EX_NOINPUT;
    }

    // --- Unlock device using the proper libmodbus function ---
    printf("--- Unlocking device ---\n");
    if (modbus_write_register(ctx, 0x002E, 0x2481) == 1) {
        printf("UNLOCKED successfully.\n");
    } else {
        fprintf(stderr, "FAILED TO UNLOCK: %s\n", modbus_strerror(errno));
    }

    // --- Write the converted value to the user-specified register ---
    printf("\n--- Writing to register ---\n");
    printf("Attempting to write value 0x%04X to register 0x%04X...\n", register_val, register_addr);

    if (modbus_write_register(ctx, register_addr, register_val) == 1) {
        printf("Write successful.\n");
    } else {
        fprintf(stderr, "FAILED to write register: %s\n", modbus_strerror(errno));
    }

    // --- Reading registers for verification ---
    printf("\n--- Reading back registers for verification ---\n");
    uint16_t tab_reg[67];
    int num_read = modbus_read_registers(ctx, 0x0000, 67, tab_reg);
    if (num_read > 0) {
        for (int i = 0; i < num_read; i++) {
            printf("register %d: %d (0x%x)\r\n", i + 1, tab_reg[i], tab_reg[i]);
        }
    } else {
        fprintf(stderr, "Failed to read registers: %s\n", modbus_strerror(errno));
    }

    modbus_close(ctx);
    modbus_free(ctx);

    return 0;
}

