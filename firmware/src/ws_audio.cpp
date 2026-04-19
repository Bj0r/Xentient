#include <Arduino.h>
#include <WebSocketsClient.h>
#include "ws_audio.h"

static WebSocketsClient s_ws;
static bool s_connected = false;

static void on_ws_event(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_CONNECTED:
            s_connected = true;
            Serial.println("[WS] Connected to harness");
            // Declare audio format so harness can validate expectations
            s_ws.sendTXT("{\"type\":\"audio_format\",\"rate\":16000,\"bits\":16,\"ch\":1}");
            break;
        case WStype_DISCONNECTED:
            s_connected = false;
            Serial.println("[WS] Disconnected — will retry");
            break;
        case WStype_ERROR:
            Serial.printf("[WS] Error len=%u\n", (unsigned)length);
            break;
        default:
            break;
    }
}

void ws_audio_init(const char* host, uint16_t port) {
    s_ws.begin(host, port, "/");
    s_ws.onEvent(on_ws_event);
    s_ws.setReconnectInterval(3000);
    Serial.printf("[WS] Connecting to %s:%u\n", host, port);
}

void ws_audio_loop() { s_ws.loop(); }

bool ws_audio_send(const uint8_t* data, size_t length) {
    if (!s_connected) return false;
    return s_ws.sendBIN(data, length);
}

bool ws_audio_connected() { return s_connected; }
