# ROM Testing Results

## Created ROMs for Testing

### 1. zelda3-exact-copy.smc
- **Status**: Exact byte-for-byte copy of original
- **Purpose**: Test if ROM handler causes crashes
- **Test this first**: If this crashes, the issue is with file handling, not modifications

### 2. zelda3-minimal-test.smc  
- **Status**: Attempted one-byte change (skipped due to unexpected value)
- **Purpose**: Test minimal modification capability
- **Result**: Essentially an exact copy

### 3. zelda3-safe-start.smc
- **Status**: SimpleSafeStartMod - attempts to change starting health only
- **Purpose**: Give Link 10 hearts at start without other changes
- **Note**: Modification location search was performed but may not have found correct offset

### 4. zelda3-magic-test.smc
- **Status**: Working infinite magic mod
- **Modifications**: Patches LinkCheckMagicCost at 0x87B0AB
- **Known to work**: This mod has been tested and functions correctly

### 5. zelda3-ultimate-test.smc
- **Status**: Combined infinite magic + quick start items
- **Warning**: May have same crash issue as original quick start

## Testing Priority

1. **Test zelda3-exact-copy.smc first**
   - If this works: ROM handler is fine, proceed to test modifications
   - If this crashes: Issue is with the ROM handler save process itself

2. **Test zelda3-safe-start.smc second**
   - If this works: We can safely modify ROMs
   - If this crashes: Need to investigate modification approach

3. **Test zelda3-magic-test.smc third**
   - This should work as it's a proven ASM patch

## Crash Analysis

The original Quick Start mod crashed with:
- Error: `os_unfair_lock is corrupt`
- Issue: Writing to wrong offsets for save file initialization
- Location: Attempted to modify 0x274EC region directly

## Next Steps

Based on test results:

### If exact-copy works but safe-start crashes:
- Focus on finding correct save initialization routine
- Use bsnes to trace save file creation
- Consider hooking into new game routine instead

### If both work:
- Gradually add more items one at a time
- Test after each addition to isolate crash cause
- Document working modification offsets

### If exact-copy crashes:
- Issue is with ROMHandler implementation
- Check buffer handling and file writing
- May need to use native fs operations instead