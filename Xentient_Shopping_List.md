# Xentient (v1 Prototype) Shopping List & Pricing

This document contains the complete Bill of Materials (BOM) needed to prototype the Xentient hardware. 
**Estimated Total Cost:** ₱1,200 – ₱1,800.

You can use the table below to track prices and shop links from Shopee, Lazada, or local electronic stores.

## 1. Node Base (The Brain & Power)

| Component | Description | Qty | Shop Link | Price (₱) |
| :--- | :--- | :--- | :--- | :--- |
| **ESP32-WROOM-32 Dev Board** | Main MCU. Recommend Type-C version (30-pin or 38-pin). | 1 | | |
| **W5500 SPI Ethernet Module** | Hardwired internet connection capability. | 1 | | |
| **TP4056 Module** | 5V LiPo battery charge controller. (Get USB Type-C). | 1 | | |
| **MT3608 Step-Up Boost Module** | Boost converter (LiPo 3.7V -> 5V for ESP32). | 1 | | |
| **18650 Li-ion Battery** | High capacity (2000-3000mAh) battery. | 1 | | |
| **18650 Battery Holder** | Single battery holder with wires/pins. | 1 | | |

## 2. Peripheral Units (Senses & Actuators)

| Component | Description | Qty | Shop Link | Price (₱) |
| :--- | :--- | :--- | :--- | :--- |
| **INMP441** | Omnidirectional MEMS Microphone (I2S). | 1 | | |
| **MAX98357A** | Class D Audio Amplifier (I2S). | 1 | | |
| **3W 8Ω Speaker** | Mini round/rectangular speaker (pairs with MAX98357A). | 1 | | |
| **OV2640 Image Sensor** | SPI/DVP Camera module (raw board, not ESP32-CAM). | 1 | | |
| **HC-SR501 or AM312** | PIR Motion Sensor. | 1 | | |
| **BME280 Module** | I2C Environmental sensor (Temp/Humidity). | 1 | | |
| **AT24C02 EEPROM Modules** | I2C memory chips for peripheral self-identification. | 4 | | |

## 3. Connectors & Prototyping (The "Snap" Interface)

| Component | Description | Qty | Shop Link | Price (₱) |
| :--- | :--- | :--- | :--- | :--- |
| **JST-SH Pigtail Cables** | 4-pin & 6-pin pairs (male/female) for snapping slots. | 1 set| | |
| **Prototyping PCB Boards** | Double-sided perfboards (e.g. 4x6cm, 5x7cm). | 1 pack| | |
| **Header Pins** | 2.54mm pitch (Male and Female strips). | 1 set| | |
| **Dupont Jumper Wires** | M-M, M-F, F-F mix (10cm & 20cm). | 1 pack| | |
| **Solid Core Wire** | 22 AWG for clean PCB soldering. | 1 roll| | |

## 4. Part Containment (Housing & Enclosures)

| Component | Description | Qty | Shop Link | Price (₱) |
| :--- | :--- | :--- | :--- | :--- |
| **ABS Electronic Project Box** | Plastic enclosure (e.g., 100x60x25mm). | 1-2 | | |
| **M2 & M3 Nylon Standoff Kit** | Spacers and screws to elevate PCBs and prevent shorts. | 1 box| | |
| **3D Printer Filament** | [Optional] PLA/PETG for custom 3D printing. | 1 roll| | |

---

**Total Cost:** ₱0.00
