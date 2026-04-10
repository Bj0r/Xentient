# Xentient (v1) — Parts Order Tracker

> Last updated: 2026-04-09
> Status: **ORDERED** — Parts arriving April 11–18, 2026

This document tracks the actual ordered Bill of Materials (BOM) for the Xentient v1 prototype.
All prices in **Philippine Pesos (₱)**.

---

## Order Summary

| Vendor | Est. Delivery | Items Cost | Paid |
| :--- | :--- | :--- | :--- |
| SAMIORE.ph | April 11–18 | ₱514 | **₱459** |
| ELEXHUB | April 11–14 | ₱265 | **₱203** |
| aitexm.ph (China) | By April 16 | ₱859 | **₱659** |
| BXV_components.ph (China) | By April 16 | ₱415 | **₱370** |
| Electrapick.Shop (China) | By April 16 | ₱169 | **₱131** |
| **TOTAL** | | **₱2,222** | **₱1,822** |

---

## Order 1 — SAMIORE.ph

**Est. Delivery:** April 11 – April 18, 2026

| Item Description | Qty | Unit Price | Paid |
| :--- | :---: | :---: | :---: |
| ESP32-CAM-MB WiFi Bluetooth + OV3660 Camera | 1 | ₱316 | ₱316 |
| 10pcs 5mm RGB LED (Diffused Cathode) | 1 | ₱29 | ₱29 |
| 10pcs 40 Pin Male Header (Black) | 1 | ₱45 | ₱45 |
| 10pcs 40 Pin Straight Female Pin Header | 1 | ₱55 | ₱55 |
| 120pcs Aluminum Electrolytic Capacitor Kit | 1 | ₱69 | ₱69 |
| **Subtotal** | | **₱514 → ₱459** |

> **Notes:**
> - ESP32-CAM-MB integrates ESP32 + camera connector. Replaces ESP32-WROOM-32 + OV2640 split in v1 prototype
> - OV3660 is 3MP (higher resolution than the OV2640 specified in architecture)
> - RGB LEDs for visual status indicators; capacitor kit for power supply decoupling

---

## Order 2 — ELEXHUB

**Est. Delivery:** April 11 – April 14, 2026

| Item Description | Qty | Unit Price | Paid |
| :--- | :---: | :---: | :---: |
| 18650 Battery Holder (1S) | 1 | ₱31 | ₱31 |
| PCB Universal Board (8x12 CM, Double Sided) | 1 | ₱69 | ₱69 |
| 18650 2200mAh Lithium Rechargeable Battery | 1 | ₱165 | ₱165 |
| **Subtotal** | | **₱265 → ₱203** |

> **Notes:**
> - 18650 cell: 2200mAh — sufficient for prototyping
> - Universal PCB for carrier board prototyping; local vendor (fastest delivery)

---

## Order 3 — aitexm.ph (China)

**Est. Delivery:** By April 16, 2026

| Item Description | Qty | Unit Price | Paid |
| :--- | :---: | :---: | :---: |
| HC-SR501 PIR Human Sensor Detector | 1 | ₱40 | ₱40 |
| TP4056 Lithium Battery Charger (Type-C) | 1 | ₱41 | ₱41 |
| MT3608 DC-DC Step Up Module (Type-C) | 1 | ₱48 | ₱48 |
| Dupont Line (30CM F-F) | 1 | ₱58 | ₱58 |
| Dupont Line (30CM M-M) | 1 | ₱60 | ₱60 |
| 3W 8R Amplifier Speaker | 1 | ₱80 | ₱80 |
| MAX98357-QFN I2S 3W Amplifier Module | 1 | ₱101 | ₱101 |
| BME280 Digital Sensor (3.3V) | 1 | ₱213 | ₱213 |
| INMP441 Omnidirectional Microphone Module | 1 | ₱218 | ₱218 |
| **Subtotal** | | **₱859 → ₱659** |

> **Notes:**
> - **MAX98357-QFN** — QFN variant of MAX98357A; same I2S Class D amp functionality
> - **INMP441** — 24-bit I2S MEMS mic; **BME280** — I2C Temp/Humidity/Pressure; **HC-SR501** — PIR motion
> - **TP4056 + MT3608** — complete power path: LiPo charging + boost to 5V

---

## Order 4 — BXV_components.ph (China)

**Est. Delivery:** By April 16, 2026

| Item Description | Qty | Unit/Lot Price | Paid |
| :--- | :---: | :---: | :---: |
| 20pcs AT24C02 24C02BN IC (SOP-8) | 1 | ₱66 | ₱66 |
| 5pcs JST XH2.54 4-Pin Wire/Cable Connector | 1 | ₱75 | ₱75 |
| 5pcs JST XH2.54 6-Pin Wire/Cable Connector | 1 | ₱87 | ₱87 |
| 6-color PVC Electronic Wire Kit (130pcs) | 1 | ₱92 | ₱92 |
| 400pcs 1/4W Metal Film Resistor Kit | 1 | ₱95 | ₱95 |
| **Subtotal** | | **₱415 → ₱370** |

> **⚠️ Action Required — JST Connector Mismatch:**
> The architecture specifies **JST-SH (1.0mm pitch)** for the Snap Interface.
> Ordered: **JST XH2.54 (2.5mm pitch)**. These are mechanically and electrically different.
> Plan adapter wiring or substitution before integration.

> **Notes:**
> - **AT24C02BN** — I2C EEPROM for peripheral self-identification (passive ID bus). SOP-8. 20pcs for multiple units + spares
> - Resistor kit for pull-ups, current limiting, LED dropping resistors

---

## Order 5 — Electrapick.Shop (China)

**Est. Delivery:** By April 16, 2026

| Item Description | Qty | Unit/Lot Price | Paid |
| :--- | :---: | :---: | :---: |
| Electrapick PCB Standoff Kit (180pcs White) | 1 | ₱169 | ₱131 |
| **Subtotal** | | **₱169 → ₱131** |

---

## Missing / Not Ordered

| Component | Status | Notes |
| :--- | :--- | :--- |
| **W5500 SPI Ethernet Module** | ❌ Not ordered | WiFi-only for v1 prototype |
| **ABS Electronic Project Box** | ❌ Not ordered | Source locally or 3D print |
| **Solid Core Wire (22 AWG)** | ❌ Not ordered | Check existing stock |
| **3D Printer Filament** | ❌ Not ordered | Optional |
| **3.3V LDO Regulator** | ❌ Not ordered | May be needed if modules lack built-in LDOs |

---

## Mapping: Ordered Parts → Architecture

### Node Base (Carrier Module)

| Architecture Spec | Ordered Part | Notes |
| :--- | :--- | :--- |
| ESP32-WROOM-32 MCU | ESP32-CAM-MB | WiFi only — no W5500 in v1 |
| USB-C power input | TP4056 Type-C | Charges 18650 |
| LiPo → 5V boost | MT3608 DC-DC Step Up | Powers ESP32 + peripherals |
| 18650 Li-ion cell | 18650 2200mAh + holder | Ordered |
| Peripheral ID bus | AT24C02BN ICs (20pcs) | Passive EEPROM for peripheral identification |
| Proto board | PCB Universal Board 8x12cm | Carrier PCB prototyping |

### Peripheral Units

| Peripheral Unit | Ordered Parts | Slot (v1) |
| :--- | :--- | :--- |
| **Microphone unit** | INMP441 | Listen (I2S) |
| **Speaker unit** | MAX98357-QFN + 3W 8Ω Speaker | Speak (I2S) |
| **Camera unit** | ESP32-CAM-MB + OV3660 | Sight (SPI/DVP) — integration approach TBD |
| **Sentinel unit** | HC-SR501 PIR + BME280 | Sense (I2C/GPIO) |

### Connectors & Hardware

| Architecture Spec | Ordered Part | Notes |
| :--- | :--- | :--- |
| Header pins | 40-pin male + 40-pin female | Peripheral slot connectors |
| Dupont wires | 30CM F-F + 30CM M-M | Prototype wiring |
| JST connectors | JST XH2.54 4-pin + 6-pin | ⚠️ Pitch mismatch with JST-SH spec |
| PCB standoffs | Electrapick 180pcs kit | Enclosure assembly |
| Resistors | 400pcs metal film resistor kit | Pull-ups, LED limiters |
| Capacitors | 120pcs electrolytic capacitor kit | Power supply decoupling |
| RGB LEDs | 10pcs diffused RGB LED | Status indicators |
| Wire kit | 6-color PVC wire 130pcs | Prototyping |

---

## Power Architecture

| Input | Components | Status |
| :--- | :--- | :--- |
| USB-C (5V) | → TP4056 → 18650 charge + MT3608 → 5V rail | ✅ Ordered |
| LiPo cell | 18650 2200mAh + holder | ✅ Ordered |
| 3.3V rails | From sensor module LDOs | Verify on modules |

---

## Budget Analysis

| Metric | Value |
| :--- | :--- |
| Total Parts Cost (listing) | ₱2,222 |
| Total Parts Paid | **₱1,822** |
| Original Budget Estimate | ₱1,200 – ₱1,800 |
| Variance | **+₱22 over upper bound** |
| Missing Parts Estimate | ₱200 – ₱400 |
| Revised Total Estimate | **₱2,022 – ₱2,222** |

---

## Delivery Timeline

```
April 11  ──┬── ELEXHUB (holder, PCB, battery)
            └── SAMIORE.ph (ESP32-CAM, headers, LEDs, capacitors)
April 16  ──┬── aitexm.ph (PIR, TP4056, MT3608, Dupont, Speaker, AMP, BME280, INMP441)
            ├── BXV_components.ph (EEPROM, JST XH2.54, wire kit, resistors)
            └── Electrapick.Shop (standoff kit)
April 18  ──┴── SAMIORE.ph (end of window)
```

Earliest full parts availability: **April 16, 2026**.