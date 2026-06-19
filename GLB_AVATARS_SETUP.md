# Avatar GLB Files Setup

## Problem
Current GLB files in `android/app/src/main/assets/avatars/` are placeholder (8 bytes each).
The app uses procedural 3D avatar as fallback — this works fine.

## To Add Real GLB Avatars

Download from: https://github.com/Aadisehgal/Aadi/tree/main/assets/avatars

Copy these files to: `android/app/src/main/assets/avatars/`
- aria.glb
- luna.glb
- nova.glb
- vega.glb
- zara.glb

## Direct Download Commands (run in project root)
```bash
mkdir -p android/app/src/main/assets/avatars
cd android/app/src/main/assets/avatars

for avatar in aria luna nova vega zara; do
  curl -L "https://raw.githubusercontent.com/Aadisehgal/Aadi/main/assets/avatars/${avatar}.glb" \
    -o "${avatar}.glb"
done
```

## Note
The app's Avatar3D component creates a procedural 3D avatar if GLB fails to load.
Real GLB files will replace the procedural avatar with custom 3D models.
