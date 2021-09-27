#!/bin/bash
set -e

read -p "Enter new version: " -r VERSION
read -p "Enter branch: " -r BRANCH

BRANCH="${BRANCH:=main}"

read -p "Releasing $VERSION on branch $BRANCH - are you sure? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Releasing $VERSION ..."

  # # build
  VERSION=$VERSION npm run build

  # # publish
  if [[ -z $TAG ]]; then
    np $VERSION --branch $BRANCH --message "build: release $VERSION"
  else
    np $VERSION --branch $BRANCH --tag $TAG --message "build: release $VERSION"
  fi

  # generate release note
  VERSION=$VERSION npm run release:note
fi
