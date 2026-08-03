#!/bin/sh
# Builds zcash-devtool for Challenge #0.
#
# Pinned to a revision we have verified end to end against the public
# testnet (wallet init, sync, balance, send with memo). Upstream main moves
# fast and is allowed to break; learners should not debug that on day one.
# Rebuilding at a newer rev is fine, just re-verify the Challenge #0 loop
# first and update the pin.
set -eu

REV=dff91300a6a6dd24629a4514499ee9d31442ed7d
DIR="${DEVTOOL_DIR:-$HOME/zcash-devtool}"

if ! command -v cargo >/dev/null 2>&1; then
  echo "Rust is not installed. Get it with one command from https://rustup.rs, then rerun this."
  exit 1
fi

if [ ! -d "$DIR/.git" ]; then
  git clone https://github.com/zcash/zcash-devtool.git "$DIR"
fi
git -C "$DIR" fetch --quiet origin
git -C "$DIR" checkout --quiet "$REV"

echo "Building zcash-devtool (a few minutes the first time)..."
# Plain release build on purpose: --all-features compiles in a TUI that
# breaks scripted use.
cargo build --release --manifest-path "$DIR/Cargo.toml"

BIN="$DIR/target/release/zcash-devtool"
echo
echo "Done. Your binary: $BIN"
echo
echo "Next, from the challenge page:"
echo "  $BIN wallet -w ~/zec-wallet init --name mine -i ~/zec-wallet/identity.txt -n test"
echo "  $BIN wallet -w ~/zec-wallet sync"
echo "  $BIN wallet -w ~/zec-wallet list-addresses"
