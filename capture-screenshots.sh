#!/bin/bash

echo "[SCREENSHOT] Starting One-Time Screenshot Capture"
echo "================================================"
echo "This will capture screenshots of all main pages"
echo "Screenshots will be saved in a timestamped folder"
echo "================================================"
echo ""

python tools/capture_all_screenshots.py

if [ $? -eq 0 ]; then
    echo ""
    echo "[SUCCESS] Screenshot capture completed!"
    echo "Check the screenshots-* folder for all captured images"
else
    echo ""
    echo "[ERROR] Screenshot capture failed!"
    echo "Check the error messages above"
fi

echo ""
read -p "Press Enter to continue..."
