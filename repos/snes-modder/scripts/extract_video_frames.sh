#!/bin/bash

# Video Frame Extractor Script
# Extracts 1 frame every 10 seconds from a video file
# Organizes output into timestamped directories
# Directory names are sanitized (spaces → underscores, special chars removed)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Function to check if ffmpeg is installed
check_ffmpeg() {
    if ! command -v ffmpeg &> /dev/null; then
        print_error "ffmpeg is not installed!"
        echo "Please install ffmpeg first:"
        echo "  macOS:   brew install ffmpeg"
        echo "  Ubuntu:  sudo apt install ffmpeg"
        echo "  Windows: Download from ffmpeg.org"
        exit 1
    fi
    print_success "ffmpeg is installed"
}

# Function to display usage
usage() {
    echo "Usage: $0 <video_file> [interval_seconds]"
    echo ""
    echo "Arguments:"
    echo "  video_file       - Path to the video file to process"
    echo "  interval_seconds - Seconds between frame extraction (default: 10)"
    echo ""
    echo "Examples:"
    echo "  $0 gameplay.mp4"
    echo "  $0 tutorial.mov 5"
    echo "  $0 /path/to/video.avi 30"
    exit 1
}

# Main script
main() {
    # Check for ffmpeg
    check_ffmpeg
    
    # Check arguments
    if [ $# -lt 1 ]; then
        print_error "No video file specified!"
        usage
    fi
    
    VIDEO_FILE="$1"
    INTERVAL="${2:-10}"  # Default to 10 seconds if not specified
    
    # Check if video file exists
    if [ ! -f "$VIDEO_FILE" ]; then
        print_error "Video file not found: $VIDEO_FILE"
        exit 1
    fi
    
    # Validate interval is a positive number
    if ! [[ "$INTERVAL" =~ ^[0-9]+$ ]] || [ "$INTERVAL" -eq 0 ]; then
        print_error "Interval must be a positive number!"
        exit 1
    fi
    
    # Get video filename without path and extension
    VIDEO_NAME=$(basename "$VIDEO_FILE")
    VIDEO_NAME="${VIDEO_NAME%.*}"
    
    # Sanitize video name: remove spaces and special characters
    # Replace spaces with underscores, remove special chars except dash and underscore
    VIDEO_NAME=$(echo "$VIDEO_NAME" | sed 's/ /_/g' | sed 's/[^a-zA-Z0-9_-]//g')
    
    # Create timestamp for this extraction session
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    
    # Create output directory
    OUTPUT_DIR="gameplay/${VIDEO_NAME}_${TIMESTAMP}"
    mkdir -p "$OUTPUT_DIR"
    
    print_info "Processing: $VIDEO_FILE"
    print_info "Output directory: $OUTPUT_DIR"
    print_info "Extracting 1 frame every $INTERVAL seconds"
    
    # Get video duration for progress indication
    DURATION=$(ffmpeg -i "$VIDEO_FILE" 2>&1 | grep "Duration" | cut -d ' ' -f 4 | sed s/,// | awk -F: '{ print ($1 * 3600) + ($2 * 60) + $3 }' | cut -d. -f1)
    
    if [ -n "$DURATION" ] && [ "$DURATION" -gt 0 ]; then
        EXPECTED_FRAMES=$((DURATION / INTERVAL))
        print_info "Video duration: ~${DURATION} seconds"
        print_info "Expected frames: ~${EXPECTED_FRAMES}"
    fi
    
    echo ""
    print_info "Starting frame extraction..."
    
    # Extract frames using ffmpeg
    # fps=1/$INTERVAL means 1 frame every $INTERVAL seconds
    ffmpeg -i "$VIDEO_FILE" \
           -vf "fps=1/$INTERVAL" \
           -q:v 2 \
           "$OUTPUT_DIR/frame_%06d.png" \
           -hide_banner \
           -loglevel error \
           -stats
    
    # Check if extraction was successful
    if [ $? -eq 0 ]; then
        # Count extracted frames
        FRAME_COUNT=$(ls -1 "$OUTPUT_DIR"/frame_*.png 2>/dev/null | wc -l)
        
        if [ "$FRAME_COUNT" -gt 0 ]; then
            print_success "Successfully extracted $FRAME_COUNT frames"
            
            # Create metadata file
            METADATA_FILE="$OUTPUT_DIR/extraction_info.txt"
            {
                echo "Video Frame Extraction Metadata"
                echo "================================"
                echo "Source Video: $VIDEO_FILE"
                echo "Extraction Date: $(date)"
                echo "Interval: 1 frame every $INTERVAL seconds"
                echo "Total Frames: $FRAME_COUNT"
                echo "Output Format: PNG"
                echo ""
                echo "Frame List:"
                echo "-----------"
                ls -1 "$OUTPUT_DIR"/frame_*.png | while read -r frame; do
                    frame_num=$(basename "$frame" | sed 's/frame_//;s/.png//')
                    frame_num_int=$((10#$frame_num))  # Convert to integer (remove leading zeros)
                    timestamp_sec=$((frame_num_int * INTERVAL))
                    timestamp_min=$((timestamp_sec / 60))
                    timestamp_sec_remainder=$((timestamp_sec % 60))
                    printf "%s - Approximate timestamp: %02d:%02d\n" "$(basename "$frame")" "$timestamp_min" "$timestamp_sec_remainder"
                done
            } > "$METADATA_FILE"
            
            print_success "Metadata saved to: $METADATA_FILE"
            
            # Show summary
            echo ""
            echo "Summary:"
            echo "--------"
            print_success "Frames saved to: $OUTPUT_DIR"
            print_info "Frame naming: frame_000001.png to frame_$(printf "%06d" "$FRAME_COUNT").png"
            
            # Show first few files as confirmation
            echo ""
            echo "First 5 frames:"
            ls -1 "$OUTPUT_DIR"/frame_*.png | head -5 | while read -r frame; do
                echo "  - $(basename "$frame")"
            done
            
            if [ "$FRAME_COUNT" -gt 5 ]; then
                echo "  ..."
            fi
            
        else
            print_error "No frames were extracted. The video might be too short for the specified interval."
            rmdir "$OUTPUT_DIR" 2>/dev/null
            exit 1
        fi
    else
        print_error "Frame extraction failed!"
        print_info "Check that the video file is valid and not corrupted."
        rmdir "$OUTPUT_DIR" 2>/dev/null
        exit 1
    fi
}

# Run the main function
main "$@"