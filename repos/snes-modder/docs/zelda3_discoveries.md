# ROM Discoveries

Total: 7 discoveries


## ITEM (2)

### item_0000
- **Offset**: 0x0274D9
- **Address**: $04:F4D9
- **Size**: 1 bytes
- **Description**: Sword type in save init table (00=none, 01=fighter, 02=master, 03=tempered, 04=gold)
- **Related**: equipment_set:item_0001

### item_0001
- **Offset**: 0x0274DA
- **Address**: $04:F4DA
- **Size**: 1 bytes
- **Description**: Shield type in save init (00=none, 01=fighter, 02=fire, 03=mirror)
- **Related**: equipment_set:item_0000


## LOGIC (1)

### logic_0006
- **Offset**: 0x028000
- **Address**: $05:8000
- **Size**: 640 bytes
- **Description**: Room header table - 320 rooms × 2 bytes each


## SPRITE (1)

### sprite_0004
- **Offset**: 0x04D62E
- **Address**: $09:D62E
- **Size**: 243 bytes
- **Description**: Sprite initialization table - 243 sprite types


## STAT (2)

### stat_0002
- **Offset**: 0x0274C0
- **Address**: $04:F4C0
- **Size**: 1 bytes
- **Description**: Current health in save init (in 1/8 hearts, 0x18 = 3 hearts)
- **Related**: paired:stat_0003

### stat_0003
- **Offset**: 0x0274C1
- **Address**: $04:F4C1
- **Size**: 1 bytes
- **Description**: Max health in save init (in 1/8 hearts, 0x18 = 3 hearts)
- **Related**: paired:stat_0002


## TILESET (1)

### tileset_0005
- **Offset**: 0x0F8000
- **Address**: $1F:8000
- **Size**: 24576 bytes
- **Description**: Overworld tileset graphics (compressed)

