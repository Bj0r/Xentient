#pragma once
#include <cstdint>

// Call once in setup() after WiFi is connected.
void ws_audio_init(const char* host, uint16_t port);

// MUST be called every loop() — handles WS keep-alive and reconnect.
void ws_audio_loop();

// Send one raw PCM S16LE chunk. Returns false if not connected.
bool ws_audio_send(const uint8_t* data, size_t length);

bool ws_audio_connected();
