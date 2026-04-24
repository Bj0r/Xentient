// ==========================================
// Xentient Framework - Main Node Module V3
// Scaled: 140mm base, 65mm height, stack zoning
// ==========================================
// Print: PETG, 0.2mm layers, 45° overhangs (support-free)
// Bed: Base (140mm F2F) flat on bed, rear face down
// Units: mm

$fn = 128;

// ==========================================
// 1. MASTER PARAMETERS
// ==========================================

// --- Hub Shell (Truncated Hex Pyramid) ---
Base_F2F    = 140.0;
Front_F2F   = 60.0;
Total_Depth = 65.0;
Collar_H    = 12.0;
Shell_T     = 3.0;

// Derived geometry
Base_R    = (Base_F2F / 2) / cos(30);     // 80.83
Front_R   = (Front_F2F / 2) / cos(30);    // 34.64
Pyr_H     = Total_Depth - Collar_H;        // 53
Base_Apo  = Base_F2F / 2;                  // 70
Front_Apo = Front_F2F / 2;                 // 30
Face_Tilt = atan((Base_Apo - Front_Apo) / Pyr_H);  // ~37.1 deg

// Inner cavity
Inner_Base_R  = Base_R - Shell_T / cos(30);    // ~77.37
Inner_Front_Z = Total_Depth - Shell_T;          // Z=62
Outer_R_at_62  = Base_R + (Front_R - Base_R) * (Inner_Front_Z - Collar_H) / Pyr_H;
Inner_Front_R2 = Outer_R_at_62 - Shell_T / cos(30);  // ~32.17

// --- Universal Socket Pocket ---
Port_W       = 24.4;    // Male sled width + 0.4mm tolerance
Port_H       = 16.4;    // Male sled height + 0.4mm tolerance
Port_D       = 15.0;    // Pocket depth (wall swells here)
WireCh_W     = 18.0;    // Wire channel width
WireCh_H     = 8.0;     // Wire channel height
Mounting_Lip = 2.0;     // Internal flange for JST-breakout PCB
Breakout_W   = 30.0;    // JST-breakout PCB width
Breakout_H   = 20.0;    // JST-breakout PCB height
Sleeve_Wall  = 2.0;     // Pocket sleeve wall thickness

// --- Battery Holder (18650 single cell) ---
BH_L       = 78.0;     // Battery holder length
BH_W       = 22.0;     // Battery holder width
BH_H       = 19.0;     // Battery holder height
BH_Clear   = 0.2;      // Clearance

// --- Master Board (120x80mm solder board) ---
Board_L    = 120.0;
Board_W    = 80.0;
Board_SoX  = 110.0;    // Standoff span X (80mm board width, ~110mm along length)
Board_SoY  = 70.0;     // Standoff span Y (120mm board length, ~70mm along width)

// --- ESP32-WROOM-32 Dev Board ---
ESP_BoardL  = 55.0;
ESP_BoardW  = 28.0;
ESP_SoX     = 22.0;
ESP_SoY     = 48.0;
ESP_SoH     = 20.0;    // Standoff pillar height

// --- Fastener specs ---
M3_Hole   = 3.2;   // M3 heat-set insert hole
M3_Boss   = 5.0;   // Slim M3 boss
M2_Hole   = 2.4;   // M2 screw body
M2_Boss   = 4.0;   // Slim M2 boss (spec says 4mm)

// --- Power Modules ---
TP4056_L  = 25.0;  TP4056_W = 19.0;  TP4056_H = 10.0;
MT3608_L  = 37.0;  MT3608_W = 22.0;  MT3608_H = 10.0;
LDO_L     = 12.0;  LDO_W    = 8.0;   LDO_H    = 5.0;
Clip_T    = 1.5;   Clip_Clear = 0.2;

// --- Rear Anchor ---
Anchor_Dia = 40.0;
Anchor_Dep = 6.0;
Anchor_Key = 10.0;

// --- Ventilation ---
Vent_N      = 4;       // Slits per face set
Vent_W      = 2.0;     // Slit width
Vent_Spc    = 6.0;     // Slit spacing
Wall_Thick  = Shell_T / cos(30);  // ~3.46mm

// --- USB-C Cutout ---
USB_W = 12.0;   // V3 spec: 12mm (was 14mm)
USB_H = 6.0;

// --- LCD Display ---
LCD_W       = 71.0;
LCD_H       = 26.0;
LCD_D       = 15.0;
LCD_Mount_X = 32.0;
LCD_Mount_Y = 12.0;