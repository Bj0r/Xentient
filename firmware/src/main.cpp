#include <Arduino.h>
#include <Wire.h>

#include "pins.h"
#include "peripherals.h"
#include "lcd_driver.h"

static bool i2c_ping(uint8_t addr) {
    Wire.beginTransmission(addr);
    return (Wire.endTransmission() == 0);
}

void setup() {
    Serial.begin(115200);
    delay(500);   // let monitor attach
    Serial.println("[BOOT] Xentient Node Base starting...");

    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    Wire.setTimeout(1000);  // prevent bus hang if lines float (T-abs-02 mitigation)

    for (size_t i = 0; i < PERIPHERAL_COUNT; i++) {
        const PeripheralDef& p = PERIPHERALS[i];
        if (p.i2cAddr == 0x00) continue;   // not I2C — skip

        bool present = i2c_ping(p.i2cAddr);
        Serial.printf("[BOOT] %s (0x%02X): %s\n",
                      p.name,
                      p.i2cAddr,
                      present ? "online" : "offline");
    }

    lcd_init();
    lcd_set_state(NodeState::BOOT);

    Serial.println("[BOOT] Init complete.");
}

void loop() {
    // Demo: cycle through all states for visual validation.
    // This block will be replaced by MQTT event handling (Xentient-cg9).
    static const NodeState states[] = {
        NodeState::BOOT,
        NodeState::LISTENING,
        NodeState::THINKING,
        NodeState::SPEAKING,
        NodeState::ERROR_STATE,
    };
    static uint8_t idx = 0;
    lcd_set_state(states[idx]);
    idx = (idx + 1) % 5;
    delay(2000);
}
