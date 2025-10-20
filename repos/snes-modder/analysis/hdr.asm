.MEMORYMAP
  SLOTSIZE $008000
  DEFAULTSLOT 0
  SLOT 0 $8000
.ENDME  

.ROMBANKSIZE $008000
.ROMBANKS 32
.EMPTYFILL $FF

.SNESHEADER
  ID "$\x01\xe20"				; 1-4 letter string

  NAME "THE LEGEND OF ZELDA  "  ; Program Title - can't be over 21 bytes,
  ;    "123456789012345678901"  ; use spaces for unused bytes of the name.
  SLOWROM
  LOROM

  CARTRIDGETYPE $02
	;$00  ROM only
	;$01  ROM and RAM
	;$02  ROM and Save RAM
	;$03  ROM and DSP1 chip
	;$04  ROM, RAM and DSP1 chip
	;$05  ROM, Save RAM and DSP1 chip
	;$13  ROM and Super FX chip
	;$13  SuperFX with no battery
	;$14  SuperFX with no battery
	;$15  SuperFX with save-RAM
	;$1a  SuperFX with save-RAM
	;$34  SA-1
	;$35  SA-1 

  ROMSIZE $0A
	;$08 - 2 Megabits (8x32K banks)
	;$09 - 4 Megabits
	;$0A - 8 Megabits
	;$0B - 16 Megabits
	;$0C - 32 Megabits
	
  SRAMSIZE $03
	;$00 - No SRAM
	;$01 - 16 kilobits
	;$02 - 32 kilobits
	;$03 - 64 kilobits

  COUNTRY $01
	;$00      NTSC Japan
	;$01      NTSC US
	;$02..$0c PAL
	;$0d      NTSC
	;$0e..$ff invalid 

  LICENSEECODE $01              ; Just use $00
  VERSION $00                   ; $00 = 1.00, $01 = 1.01, etc.
.ENDSNES

.SNESNATIVEVECTOR               ; Define Native Mode interrupt vector table
  COP $822C
  BRK $FFFF
  ABORT $822C
  NMI $80C9
  IRQ $82D8
  UNUSED $8000
.ENDNATIVEVECTOR

.SNESEMUVECTOR                  ; Define Emulation Mode interrupt vector table
  COP $822C
  ABORT $822C
  NMI $822C
  RESET $8000              ; where execution starts
  IRQBRK $82D8
  UNUSED $822C
.ENDEMUVECTOR
