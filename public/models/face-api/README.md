# Face-API.js Model Files

This directory contains the face-api.js model files required for face recognition.

## Setup

Model files are not committed to git due to their large size (~12MB).
To download them, run:

```bash
./scripts/setup-face-models.sh
```

## Required Models

The following models are needed for face recognition:

1. **SSD MobileNet v1** - Face detection
2. **Face Landmark 68** - Facial landmark detection
3. **Face Recognition Net** - Face descriptor extraction (128-dimensional)

## Manual Download

If the setup script doesn't work, you can manually download the models from:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Download these files:
- `ssd_mobilenetv1_model-weights_manifest.json`
- `ssd_mobilenetv1_model-shard1`
- `ssd_mobilenetv1_model-shard2`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

## Note

These models are used only for client-side face detection and descriptor extraction.
All face matching/verification is performed server-side for security.
