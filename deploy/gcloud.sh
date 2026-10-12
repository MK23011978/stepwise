#!/usr/bin/env bash
# Runs the official Google Cloud CLI in Docker (no local install needed). Credentials persist in ~/.config/gcloud.
exec docker run --rm -i $([ -t 0 ] && echo -t) \
  -v "$HOME/.config/gcloud:/root/.config/gcloud" \
  -v "$HOME/.ssh:/root/.ssh" \
  -v "/Users/muratkaplan/GCSE Program:/work" -w /work \
  gcr.io/google.com/cloudsdktool/google-cloud-cli:slim gcloud "$@"
