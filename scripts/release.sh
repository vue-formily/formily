#!/bin/bash
set -e

if [[ -z $1 ]]; then
  read -p "Enter new version: " -r VERSION
else
  VERSION=$1
fi

read -p "Releasing $VERSION - are you sure? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Releasing $VERSION ..."

  # # build
  VERSION=$VERSION npm run build

  # # publish
  if [[ -z $TAG ]]; then
    np $VERSION --message "build: release $VERSION"
  else
    np $VERSION --tag $TAG --message "build: release $VERSION"
  fi

  # generate release note
  VERSION=$VERSION npm run release:note
fi
