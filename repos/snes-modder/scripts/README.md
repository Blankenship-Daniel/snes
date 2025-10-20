# Scripts Directory

Utility scripts for the SNES Modder project.

## extract_video_frames.sh

Extracts frames from video files at specified intervals for analysis.

### Usage

```bash
./scripts/extract_video_frames.sh <video_file> [interval_seconds]
```

### Arguments

- `video_file` - Path to the video file to process
- `interval_seconds` - Seconds between frame extraction (default: 10)

### Examples

```bash
# Extract frames every 10 seconds (default)
./scripts/extract_video_frames.sh gameplay.mp4

# Extract frames every 5 seconds
./scripts/extract_video_frames.sh tutorial.mov 5

# Extract frames every 30 seconds
./scripts/extract_video_frames.sh /path/to/video.avi 30
```

### Output

Frames are saved to `gameplay/<video_name>_<timestamp>/` with:
- PNG images named `frame_000001.png`, `frame_000002.png`, etc.
- Metadata file `extraction_info.txt` with timestamps and details

### Requirements

- **ffmpeg** must be installed
  - macOS: `brew install ffmpeg`
  - Ubuntu: `sudo apt install ffmpeg`
  - Windows: Download from ffmpeg.org

### Features

- ✅ Automatic timestamp-based organization
- ✅ Progress indication during extraction
- ✅ Metadata file with frame timestamps
- ✅ Error handling and validation
- ✅ Colored terminal output
- ✅ Support for any video format ffmpeg can read

### Use Cases

1. **Tutorial Analysis** - Extract frames from video tutorials to analyze with Claude
2. **Gameplay Study** - Capture key moments from gameplay videos
3. **Documentation** - Create visual references from video content
4. **Reverse Engineering** - Study game behavior frame by frame