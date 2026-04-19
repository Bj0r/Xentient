#include <Arduino.h>
#include <Wire.h>
#include <ArduinoJson.h>

#include "pins.h"
#include "peripherals.h"
#include "lcd_driver.h"
#include "mqtt_client.h"
#include "bme_reader.h"
#include "messages.h"

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

    // Initialize BME280 sensor
    bool bmeOk = bme_init();
    Serial.printf("[BOOT] BME280: %s\n", bmeOk ? "online" : "offline");

    // Initialize MQTT client (connects to broker, subscribes to topics)
    mqtt_init();

    Serial.println("[BOOT] Init complete.");
}

static unsigned long lastTelemetryMs = 0;

// Helper: round float to 2 decimal places for clean JSON output
static float rounded2(float v) {
    return round(v * 100.0F) / 100.0F;
}

void loop() {
    mqtt_loop();  // MUST be called every iteration — handles reconnect + incoming messages

    // Publish telemetry at TELEMETRY_INTERVAL_MS
    if (mqtt_connected() && (millis() - lastTelemetryMs >= TELEMETRY_INTERVAL_MS)) {
        lastTelemetryMs = millis();

        BmeReading reading;
        if (bme_read(reading)) {
            // Build JSON payload per CONTRACTS.md sensor_data schema
            JsonDocument doc;
            doc["v"] = MSG_VERSION;
            doc["type"] = "sensor_data";
            doc["peripheralType"] = PERIPHERAL_TYPE_BME280;

            JsonObject payload = doc["payload"].to<JsonObject>();
            payload["temperature"] = rounded2(reading.temperature);
            payload["humidity"] = rounded2(reading.humidity);
            payload["pressure"] = rounded2(reading.pressure);

            doc["timestamp"] = (uint32_t)millis();  // epoch-millis; TODO: NTP for wall clock

            char buffer[256];
            serializeJson(doc, buffer, sizeof(buffer));
            mqtt_publish(TOPIC_ENV, buffer, strlen(buffer));

            Serial.printf("[MQTT] Published: t=%.1f h=%.1f p=%.1f\n",
                          reading.temperature, reading.humidity, reading.pressure);
        } else {
            Serial.println("[BME] Read failed — skipping publish");
        }
    }

    delay(10);  // yield to WiFi stack — keeps loop() under 100ms
}