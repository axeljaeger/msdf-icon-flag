#!/usr/bin/env sh

set -eu

# Requires the official KTX-Software CLI: https://github.com/KhronosGroup/KTX-Software
ktx create \
  --format R8G8B8A8_UNORM \
  --assign-tf linear \
  --assign-texcoord-origin top-left \
  --generate-mipmap \
  --layers 5 \
  public/icons/layers/home.png \
  public/icons/layers/favorite.png \
  public/icons/layers/star.png \
  public/icons/layers/face.png \
  public/icons/layers/pets.png \
  public/icons/material-icons-msdf-array.ktx2

ktx validate public/icons/material-icons-msdf-array.ktx2
