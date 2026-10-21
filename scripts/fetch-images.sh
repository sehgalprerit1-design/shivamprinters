#!/usr/bin/env bash
# Downloads the Nano Banana-generated site imagery (Higgsfield CDN) into public/images,
# resizing to web sizes. Requires curl; uses sips (macOS) or ImageMagick if present.
set -e
cd "$(dirname "$0")/../public/images"
B=https://d8j0ntlcm91z4.cloudfront.net/user_3AgmoO1kEvlZmppIBOozz4803o0
while read -r name id; do
  echo "→ $name"; curl -sSfL -o "$name.png" "$B/$id.png"
  w=1400; [ "$name" = hero ] && w=1800
  if command -v magick >/dev/null; then magick "$name.png" -resize "${w}x${w}>" -strip -quality 74 "$name.jpg"
  elif command -v convert >/dev/null; then convert "$name.png" -resize "${w}x${w}>" -strip -quality 74 "$name.jpg"
  else sips -s format jpeg -s formatOptions 74 -Z $w "$name.png" --out "$name.jpg" >/dev/null; fi
  rm -f "$name.png"
done <<'LIST'
hero hf_20261021_042031_d491c102-b12d-4de7-bae1-1b5aba7de0d1
cat-photobooks hf_20261021_043435_d2a1bff1-d1df-4f3b-a7af-f3d1269aedab
cat-frames hf_20261021_042031_2bd734dd-8558-49d5-b119-47a9068e9a35
cat-calendars hf_20261021_042032_ae7ffa4c-ab9e-4ae0-a748-d2413542717b
cat-kids hf_20261021_042032_58aecbd5-89cd-42a7-9976-2e5bba056c31
cat-decor hf_20261021_043435_5a5d6991-eaab-465b-aa4e-76a6258dd411
cat-gifts hf_20261021_042032_266e64cc-455e-433a-a4a3-73bacd30b8b2
cat-prints hf_20261021_042031_b067e3d8-65be-4dc6-a484-f10e80bdd291
cat-bags hf_20261021_042031_f19254ee-1bfe-45a2-ae6a-bb538e2dc192
diwali hf_20261021_042031_0c8b947e-bad0-47ee-b823-35f3d96e6e82
wedding hf_20261021_042031_bdfc4612-f7cf-42a4-aa9c-5af7eeec4ec9
birthday hf_20261021_042031_0f418d1d-3f33-4815-800f-4eeae3ef20de
LIST
echo "Done. 12 images in public/images."
