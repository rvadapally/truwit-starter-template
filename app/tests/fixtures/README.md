# Test Fixtures

This directory contains test files used by Playwright E2E tests.

## Required Files

### 1. `sample.mp4` (Small test video)
**Purpose:** Test file upload functionality  
**Size:** ~5-10 MB  
**Duration:** 10-30 seconds  
**Format:** MP4 (H.264)

**How to create:**

```bash
# Option 1: Using ffmpeg (recommended)
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 \
       -f lavfi -i sine=frequency=1000:duration=10 \
       -pix_fmt yuv420p -c:v libx264 -c:a aac \
       sample.mp4

# Option 2: Download a small video
curl -o sample.mp4 https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4

# Option 3: Use your own video
# Just copy any MP4 file and rename it to sample.mp4
```

---

### 2. `test-file.txt` (Non-video file)
**Purpose:** Test file type validation  
**Size:** <1 KB  
**Content:** Any text

**How to create:**

```bash
echo "This is a test file for type validation" > test-file.txt
```

---

## Optional Files

### 3. `large-video.mp4` (Large test video)
**Purpose:** Test file size limits  
**Size:** >500 MB  
**Only needed for:** File size validation tests (currently skipped)

**How to create:**

```bash
# Create a large test video (~600MB, 10 minutes)
ffmpeg -f lavfi -i testsrc=duration=600:size=1920x1080:rate=30 \
       -f lavfi -i sine=frequency=1000:duration=600 \
       -c:v libx264 -preset ultrafast -b:v 8M \
       -c:a aac -b:a 128k \
       large-video.mp4
```

---

### 4. `sample.mov` / `sample.avi` / `sample.webm` (Other formats)
**Purpose:** Test multiple video formats  
**Only needed for:** Format compatibility tests

**How to create:**

```bash
# Convert sample.mp4 to other formats
ffmpeg -i sample.mp4 -c copy sample.mov
ffmpeg -i sample.mp4 -c:v libx264 -c:a libvorbis sample.webm
ffmpeg -i sample.mp4 -c:v mpeg4 -c:a mp3 sample.avi
```

---

## .gitignore

These test files should **NOT** be committed to Git (too large):

```gitignore
# Test fixtures (video files)
*.mp4
*.mov
*.avi
*.webm
large-*
```

**Exception:** `test-file.txt` can be committed (very small).

---

## Current Status

```
tests/fixtures/
├── README.md           ✅ (this file)
├── sample.mp4          ⚠️  (you need to create this)
├── test-file.txt       ⚠️  (you need to create this)
└── large-video.mp4     ⊘ (optional)
```

---

## Quick Setup

```bash
cd app/tests/fixtures

# Create sample video
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 \
       -f lavfi -i sine=frequency=1000:duration=10 \
       -pix_fmt yuv420p -c:v libx264 -c:a aac \
       sample.mp4

# Create text file
echo "This is a test file for validation" > test-file.txt

# Verify
ls -lh
```

---

## Testing Without Fixtures

If you don't have fixtures yet, tests will skip gracefully:

```typescript
const testFilePath = path.join(__dirname, '../fixtures/sample.mp4');

if (!fs.existsSync(testFilePath)) {
  test.skip(true, 'sample.mp4 not found - run: npm run create:fixtures');
}
```

---

## Alternative: Use Existing Test Files

Instead of creating new files, you can copy from your `app/src/testFiles/` directory:

```bash
# Copy existing test video
cp ../../src/testFiles/sample.mp4 ./

# Done!
```

---

## Cleanup

To remove all test fixtures (save disk space):

```bash
# Delete all video files
rm -f *.mp4 *.mov *.avi *.webm

# Keep README and text file
# (they're small and useful)
```




