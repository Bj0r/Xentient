Xentient Framework: Master Mechanical & 3D Printing Specification V3
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

Dimensions: * Base Width (Wall-side): 150mm flat-to-flat (Radius ~86.6mm).

Front Width: 60mm flat-to-flat (Radius ~34.6mm).

Total Depth: 90mm.

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

6. Internal Spatial Layout Protocol
All component placement inside the Main Node Module must respect the truncated hex-pyramid geometry. The cavity tapers from 150mm F2F (rear) to 60mm F2F (front) over 90mm depth. Components that fit at Z=0 may NOT fit at Z=45.

Cavity Taper Awareness: At any Z-height, the flat-to-flat (F2F) width is: F2F(Z) = Base_F2F - (Base_F2F - Front_F2F) * (Z - Collar_H) / Pyr_H. For Z < Collar_H, F2F = Base_F2F.

Hex Boundary Constraint: A rectangular component of width W and height H fits inside a hex with circumradius R only if all four corners lie inside the hex. The critical constraint is: H/2 ≤ −√3·(W/2) + √3·R. Components wider than the inscribed rectangle must have corners chamfered.

Minimum Clearance Rule: No component or standoff may have less than 3mm clearance from the cavity wall on any side. If clearance falls below 2mm, increase Total_Depth or relocate the component to a wider zone.

Z-Stack Zoning (90mm depth):
Zone A (Z=3–15): Battery holder + power modules (TP4056, MT3608, LDO) on floor plate.
Gap (Z=15–20): Wire routing.
Zone B (Z=20–37): Master solder board (120×80mm, chamfered corners) on M3 standoffs.
Gap (Z=37–45): Wire routing.
Zone C (Z=45–65): ESP32-WROOM-32 dev board (55×28mm) on M2 standoffs, Y-offset +18mm.
Gap (Z=65–75): Wire routing to LCD.
Front (Z=75–87): LCD 16×2 display (71×26mm), mounted as a Display Cap.

Floor Plan: Power modules (TP4056, MT3608) cluster near USB-C wall (Y=+30mm). Battery holder centered at Y=−25mm. Master board centered on X-axis. ESP32 offset Y=+18mm for USB-C access.

7. Modular Internal Design Protocol
Rationale: The hub shell is a complex, enclosed hex-pyramid. Printing internal plates, standoffs, and component mounts as part of the shell creates impossible overhangs and makes assembly difficult. The modular approach separates internal structure into independent, 3D-printable plates that screw or glue into mounting bosses printed on the hub shell interior.

Hub Shell Scope (what stays in v3.scad):
- Outer shell (truncated hex pyramid + collar)
- Socket pockets (7 faces) + sleeves
- Ventilation gills
- Rear anchor
- USB-C cutout
- Aesthetic/structural ribs
- Mounting bosses ONLY (M3/M2 heat-set inserts) on cavity walls
- Vertical alignment keyways (3× at 0°, 120°, 240°) on cavity walls

Module Definitions (separate .scad files):

Zone A Tray (zone_a_tray.scad): Battery cradle floor plate with clip-in pockets for TP4056, MT3608, LDO. Screws onto 4× M3 bosses at Z=3. Aligns via keyways at 0° and 120°. Must fit within hex F2F at Z=3 (≈142mm).

Zone B Plate (zone_b_plate.scad): Master solder board mounting plate with 4× M3 standoffs (110×70mm span), cross-bracing, central wire routing cutout, chamfered corners. Screws onto 4× M3 bosses at Z=20. Must fit within hex F2F at Z=20 (≈133mm).

Zone C Plate (zone_c_plate.scad): ESP32-WROOM-32 mounting plate with 4× M2 standoffs (22×48mm span) and anti-rotation nub. Screws onto 4× M2 bosses at Z=45. Must fit within hex F2F at Z=45 (≈106mm).

Display Cap (display_cap.scad): LCD 16×2 housing with bezel, M3 standoffs for backpack, snap-fit backplate. Plugs into front center socket per Universal Mating Protocol.

Assembly Method:
1. Print hub shell (v3.scad) with bosses and keyways.
2. Heat-set M3/M2 brass inserts into bosses.
3. Print Zone A tray, test-fit battery + power modules.
4. Screw Zone A tray onto bosses at Z=3 using M3×6 screws.
5. Wire battery leads to TP4056, then TP4056 to MT3608/LDO.
6. Print Zone B plate, mount solder board with M3×4 screws.
7. Screw Zone B plate onto bosses at Z=20 using M3×8 screws.
8. Route wires through gap (Z=15–20).
9. Print Zone C plate, mount ESP32 with M2×4 screws.
10. Screw Zone C plate onto bosses at Z=45 using M2×6 screws.
11. Wire JST connectors to board pads.
12. Plug peripheral caps into side/front sockets.

Fastener Standards: M3 heat-set insert (4.2mm hole, 5mm boss) for structural mounts. M2 heat-set insert (2.4mm hole, 4mm boss) for PCB mounts. Screw lengths: M3×6 (tray), M3×8 (plate), M2×4 (PCB), M2×6 (plate).