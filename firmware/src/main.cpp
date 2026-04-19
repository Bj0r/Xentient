#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#include "pins.h"
#include "peripherals.h"

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

    bool lcdOnline = false;

    for (size_t i = 0; i < PERIPHERAL_COUNT; i++) {
        const PeripheralDef& p = PERIPHERALS[i];
        if (p.i2cAddr == 0x00) continue;   // not I2C — skip

        bool present = i2c_ping(p.i2cAddr);
        Serial.printf("[BOOT] %s (0x%02X): %s\n",
                      p.name,
                      p.i2cAddr,
                      present ? "online" : "offline");

        if (p.i2cAddr == 0x27 && present) {
            lcdOnline = true;
        }
    }

    if (lcdOnline) {
        LiquidCrystal_I2C lcd(0x27, 16, 2);
        lcd.init();
        lcd.backlight();
        lcd.setCursor(0, 0);
        lcd.print("boot ok");
        Serial.println("[BOOT] LCD message written.");
    }

    Serial.println("[BOOT] Init complete.");
}

void loop() {
    // no-op — boot scaffold only
}
