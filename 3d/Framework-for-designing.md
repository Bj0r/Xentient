Xentient Framework: Master Mechanical & 3D Printing Specification V2
Architecture: Distributed Hub-and-Spoke Edge AI (Truncated Hex-Pyramid Base)
Core Pivot: 16x2 LCD is now classified as an independent, pluggable peripheral cap.

1. Global 3D Printing & Manufacturing Guidelines
To ensure the modularity works and the electronics survive, all parts must adhere to these physical constraints.

Material: PETG is mandatory for the Main Node, Speak Cap (Amp heat), and Sight Cap (ESP32-CAM heat). PLA will warp.

Structural Wall Thickness: Minimum 3.0mm for the main hub shell and anchor planes. Peripherals can use 1.5mm–2.0mm walls to save weight.

Tolerances: * Friction Fits (Sleds/Plugs): Male parts must be designed exactly 0.4mm smaller (0.2mm offset on all sides) than their female receivers.

Screw Holes: Add 0.2mm to the diameter of screw bodies (e.g., M3 body = 3.2mm hole).

Fasteners: Use Brass Heat-Set Inserts (M2 for PCBs, M3 for structural anchors) instead of tapping plastic.

Overhangs/Bridging: Design internal cavities with 45° chamfers to eliminate the need for internal supports (which are difficult to remove from the enclosed Hub).

2. The Universal Mating Protocol (The Sled & Socket)
This is the standardized mechanical interface connecting every Cap to the Hub.

The Female Socket (Carved into the Hub):

Width: 24.0mm

Height: 16.0mm

Depth: 10.0mm

Internal Wire Channel: 18.0mm W x 8.0mm H (Sized precisely to allow a 6-pin JST XH2.54 connector to pass through during assembly).

The Male Sled (The base of every Peripheral Cap):

Width: 23.6mm

Height: 15.6mm

Depth: 10.0mm

Feature: A 1-degree draft angle on the outer walls to allow it to wedge tightly into the female socket without snapping.

Hollow Core: 18.0mm x 8.0mm pass-through for the pigtail wiring.

3. Main Node Module (The Hex-Core Base)
The Conduit Entity. It does not process AI; it powers the system and routes telemetry.

Geometry: Truncated Hexagonal Pyramid.

Dimensions: * Base Width (Wall-side): 90mm flat-to-flat (Radius 45mm).

Front Width: 50mm flat-to-flat (Radius 25mm).

Total Depth: 45mm.

Port Matrix: * 1x Center Front (Dedicated to the wide Display Cap).

6x Angled Perimeter Faces (For sensors).

1x Rear Anchor Pocket (40mm diameter, 6mm deep, with anti-rotation cross-keys).

Perimeter Port Assignments (recommended for optimal sensor placement):
30°  = Sight (ESP32-CAM) — high visibility, clear line of sight
90°  = Speak (MAX98357A) — near USB-C cutout and ventilation
150° = Climate (BME280) — away from heat sources
210° = Motion (PIR HC-SR501) — human detection height
270° = Listen (INMP441) — opposite speaker to avoid feedback
330° = Reserved (future peripheral)

Ventilation: 4 slits per face (2mm wide, 45° chamfered) on 3 alternating collar faces (0°, 120°, 240° — between port faces). Critical for MAX98357A amp heat dissipation.

Internal Zoning & Mounts:

Zone A (Rear/Equator): An internal cradle sized to hold a single 18650 plastic clip-in battery holder (typical ~53x25x19mm). Cell: 65x18mm. The holder seats horizontally across the widest 90mm section. Cradle pocket is printed with 0.2mm clearance around the holder for easy insertion. Alignment lips (1.5mm walls, 3mm tall) on all 4 sides prevent sliding. Hot-glue for final securement. Wire routing: holder leads exit through a channel toward Zone C (TP4056 charge board).

Zone B (Middle): 4x M2 heat-set insert standoffs (10mm height) for the ESP32-WROOM-32 dev board (55x28mm), mounted transversely. Anti-rotation nub near one standoff. Board sits above Zone A with clearance.

Zone C (Pockets): Clip-in mounting for the TP4056 (25x19mm, aligned with USB-C cutout on 90° face), MT3608 boost (37x22mm, adjacent to TP4056), and 3.3V LDO (12x8mm, between MT3608 and ESP32). Each module sits in a 2mm floor recess with 1.5mm alignment walls.

Wiring: Female JST XH headers will sit loose or be hot-glued directly behind each of the 7 female sockets inside the cavity.

4. Peripheral Cap Specifications
Each Cap is a standalone 3D print that begins with the Universal Male Sled and blossoms into its specific housing.

Housing 1: Listen (Microphone)
Component: INMP441 MEMS mic (8x8mm) + 100nF cap.

Connection: 6-pin JST pigtail (I2S).

3D Form Factor: Low-profile dome extending ~10mm from the sled.

Features: A micro-pinhole array (1mm holes) on the front face for acoustic transparency. Internal slot to slide the 8x8mm PCB securely without screws.

Housing 2: Speak (Amplifier + Speaker)
Component: MAX98357A (7x7mm) + 3W 8Ω Speaker (40mm).

Connection: 6-pin JST pigtail (I2S).

3D Form Factor: Heavy trapezoidal box. Since the 40mm speaker is wider than the 24mm plug, the housing must flare outward.

Features: Heavy structural grille. Internal thermal divider to separate the MAX98357A (which generates heat) from the speaker magnet. Top/bottom ventilation slits for the amp.

Mounting Rule: Due to size, must be designed with an asymmetrical offset so it doesn't block neighboring Caps.

Housing 3: Climate (Environmental)
Component: BME280 (13x10mm) + 100nF cap.

Connection: 6-pin JST pigtail (4 active: VCC, GND, SDA, SCL).

3D Form Factor: Standoff vented box.

Features: Must extend at least 15mm away from the hub before housing the sensor to avoid reading the heat generated by the Hub's ESP32/battery. Heavily louvered sides (gill slits) for maximum passive airflow.

Housing 4: Motion (Presence)
Component: HC-SR501 PIR (23x23mm board, 15mm dome).

Connection: 4-pin JST pigtail (VCC, GND, OUT, NC). 4th pin unused/floats — 3-pin JST not in BOM.

3D Form Factor: Recessed shroud.

Features: A precise 15.5mm circular front cutout allowing the Fresnel lens dome to protrude. Two small 3mm access holes on the side wall to allow a screwdriver to adjust the Sensitivity and Delay potentiometers without disassembling the housing.

Housing 5: Sight (Camera)
Component: ESP32-CAM-MB dual-board (40x27mm).

Connection: 4-pin JST pigtail (UART: VCC, GND, TX, RX).

3D Form Factor: Articulated Head.

Features: The Male Sled terminates in a Ball Joint. The Camera housing features the socket. This allows the camera to be manually aimed up/down/left/right after plugging it in. Front face features an exact cutout for the OV2640 lens. Ensure plastic is kept thin (<1.5mm) near the onboard WiFi antenna trace to prevent signal blocking.

Housing 6: Display (The Monitor) - NEW
Component: LCD 16x2 + PCF8574 backpack (71x26x15mm).

Connection: 4-pin JST pigtail (I2C: VCC, GND, SDA, SCL).

3D Form Factor: Flared Monitor. The base is the 24x16mm sled, which rapidly flares outward to a 75x30mm rectangular bezel.

Features: An exact 71x27mm window on the front. Internal M3 standoffs to bolt the LCD backpack in place. A snap-fit backplate to enclose it.

Mounting Rule: Exclusively designed to plug into the Center Front socket of the Hub.

5. Anchor Ecosystem (The Mounts)
These adapters plug into the Rear Universal Anchor (40mm circular recess) of the Main Hub.

Wall Plate Adapter: A 40x6mm male cylinder with cross-keys that fits the hub. It flares out to a flat 60x60mm plate with four M3 countersunk holes for wall mounting. Includes a central 15mm hole if routing USB power directly through the drywall.

Desk Pedestal Adapter: A weighted, wedge-shaped stand. It holds the Hub at a 15-degree upward angle for optimal desk viewing and mic pickup. Features a hollow routing channel to feed the USB-C power cable out the back of the base.