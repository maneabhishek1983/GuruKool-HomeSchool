#!/bin/bash
# Script to download face-api.js model files
# These models are required for client-side face detection

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Model directory
MODEL_DIR="public/models/face-api"

# Face-api.js model URLs (from official repo)
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Required model files
MODELS=(
    # SSD MobileNet v1 - Face Detection
    "ssd_mobilenetv1_model-weights_manifest.json"
    "ssd_mobilenetv1_model-shard1"
    "ssd_mobilenetv1_model-shard2"
    # Face Landmark 68 - Landmark Detection
    "face_landmark_68_model-weights_manifest.json"
    "face_landmark_68_model-shard1"
    # Face Recognition Net - Face Descriptor Extraction
    "face_recognition_model-weights_manifest.json"
    "face_recognition_model-shard1"
    "face_recognition_model-shard2"
)

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Face-API.js Model Setup${NC}"
echo -e "${YELLOW}========================================${NC}"

# Create model directory
if [ ! -d "$MODEL_DIR" ]; then
    echo -e "${GREEN}Creating model directory: $MODEL_DIR${NC}"
    mkdir -p "$MODEL_DIR"
else
    echo -e "${YELLOW}Model directory already exists: $MODEL_DIR${NC}"
fi

# Download each model file
echo -e "${GREEN}Downloading model files...${NC}"

for model in "${MODELS[@]}"; do
    FILE_PATH="$MODEL_DIR/$model"

    if [ -f "$FILE_PATH" ]; then
        echo -e "${YELLOW}  Skipping (already exists): $model${NC}"
    else
        echo -e "${GREEN}  Downloading: $model${NC}"
        curl -sS -o "$FILE_PATH" "$BASE_URL/$model"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}    Success!${NC}"
        else
            echo -e "${RED}    Failed to download: $model${NC}"
            exit 1
        fi
    fi
done

# Verify downloads
echo -e "\n${YELLOW}Verifying downloads...${NC}"
MISSING=0
for model in "${MODELS[@]}"; do
    if [ ! -f "$MODEL_DIR/$model" ]; then
        echo -e "${RED}  Missing: $model${NC}"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -eq 0 ]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}All model files downloaded successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "\nModel files location: ${YELLOW}$MODEL_DIR${NC}"
    echo -e "\nTotal files: ${GREEN}${#MODELS[@]}${NC}"

    # Show file sizes
    echo -e "\n${YELLOW}File sizes:${NC}"
    du -h "$MODEL_DIR"/*
else
    echo -e "\n${RED}Error: $MISSING file(s) missing${NC}"
    exit 1
fi

echo -e "\n${GREEN}Face recognition models are ready!${NC}"
