
### 1. Go to the target folder
cd /path/to/your/images

### Example:
 cd ~/Desktop/site-images


### 2. Inspect image properties
sips -g pixelWidth -g pixelHeight -g format *.png

### Full metadata for one file:
sips -g all image.png


### 3. Convert filenames to lowercase (optional but highly recommended)
#### Prevents broken links on Linux web servers

for f in *; do
    mv "$f" "$(echo "$f" | tr '[:upper:]' '[:lower:]')"
done


### 4. Replace spaces with hyphens (recommended for web publishing)

for f in *\ *; do
    mv "$f" "${f// /-}"
done


### 5. Resize large PNG images
#### Example: maximum width = 1600 px, preserving aspect ratio

mkdir -p resized

for f in *.png; do
    sips -Z 1600 "$f" --out "resized/$f"
done


### 6. Convert PNG → JPEG for photos/screenshots
#### (Usually much smaller for internet publishing)

mkdir -p jpg

for f in *.png; do
    sips -s format jpeg "$f" --out "jpg/${f%.png}.jpg"
done


### 7. Compress JPEG quality
#### Recommended web range: 70–85

mkdir -p jpg-compressed

for f in jpg/*.jpg; do
    sips -s formatOptions 80 "$f" --out "jpg-compressed/$(basename "$f")"
done


### 8. Strip unnecessary metadata (recommended)

mkdir -p clean

for f in *.png; do
    sips --deleteProperty profile "$f" --out "clean/$f"
done


### 9. Normalize PNG color profile to standard sRGB
#### Important for consistent browser rendering

mkdir -p srgb

for f in *.png; do
    sips -m /System/Library/ColorSync/Profiles/sRGB\ Profile.icc \
    "$f" --out "srgb/$f"
done


### 10. Quick size comparison

du -sh .


### Detailed per-file sizes

ls -lh


### 11. Find suspiciously huge images (>5 MB)

find . -type f -size +5M


### 12. Final recommended structure before upload

#### original/     -> untouched originals
#### resized/      -> resized PNG
#### jpg/          -> converted JPEG
#### jpg-compressed/ -> final optimized web images
#### clean/        -> metadata-cleaned images
#### srgb/         -> color-normalized images


============================================
### Typical practical workflow
============================================

## Photos/screenshots:
### PNG -> resize -> JPEG -> compress

## Diagrams/plots/text-heavy graphics:
### PNG -> resize only

## Transparent graphics/logos:
### Keep PNG

## Scientific figures:
### Usually PNG preferred

## Final upload target:
### jpg-compressed/ or resized/

 ============================================


## 13. One-line "quick web normalization" example
### Resize + convert to JPEG + quality 80

mkdir -p web

for f in *.png; do
    tmp="web/${f%.png}.jpg"
    sips -Z 1600 "$f" --out "$tmp"
    sips -s format jpeg -s formatOptions 80 "$tmp" --out "$tmp"
done