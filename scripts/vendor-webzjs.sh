#!/usr/bin/env bash
# Builds the WebZjs WASM packages from source into packages/scaffold-zec/vendor/.
# WebZjs is not published to npm yet, so we build it ourselves.
#
# Requirements:
#   - rustup (nightly toolchain + rust-src are installed automatically)
#   - wasm-pack (installed automatically via npm if missing)
#   - A clang that can target wasm32-unknown-unknown for C deps (secp256k1):
#       * Linux: distro clang works
#       * macOS: Apple clang can NOT — install LLVM (brew install llvm) or use
#         the Docker path: ./scripts/vendor-webzjs.sh --docker
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_DIR="$REPO_ROOT/packages/scaffold-zec/vendor"
WORK_DIR="${WEBZJS_WORK_DIR:-$(mktemp -d)}/WebZjs"

if [[ "${1:-}" == "--docker" ]]; then
  # Build inside the official Rust image — sidesteps macOS clang issues.
  docker run --rm -v "$VENDOR_DIR:/vendor" rustlang/rust:nightly bash -c '
    set -euo pipefail
    apt-get update -qq && apt-get install -y -qq clang curl git >/dev/null
    curl -sSf https://rustwasm.github.io/wasm-pack/installer/init.sh | sh >/dev/null
    rustup component add rust-src
    git clone https://github.com/jinolabs-xyz/WebZjs.git /work && git -C /work checkout a50df944c32243cb8da9f86e7d52cb65ac926439
    cd /work/crates/webzjs-wallet
    wasm-pack build -t web --release --scope chainsafe \
      --out-dir ../../packages/webzjs-wallet \
      --no-default-features --features="wasm no-bundler" \
      -Z build-std="panic_abort,std"
    cd /work && sh ./add-worker-module.sh || true
    cd /work/crates/webzjs-keys
    wasm-pack build -t web --release --scope chainsafe \
      --out-dir ../../packages/webzjs-keys \
      --no-default-features -Z build-std="panic_abort,std"
    mkdir -p /vendor
    cp -r /work/packages/webzjs-wallet /vendor/webzjs-wallet
    cp -r /work/packages/webzjs-keys /vendor/webzjs-keys
  '
  echo "✅ Vendored into $VENDOR_DIR"
  exit 0
fi

command -v wasm-pack >/dev/null || npm install -g wasm-pack

# Our fork, pinned to an exact rev — upstream ChainSafe is unmaintained
# (dead since 2026-04-16) and an unpinned clone made vendor builds
# unreproducible. The NU6.3/Ironwood bump lands on this fork.
WEBZJS_REPO="${WEBZJS_REPO:-https://github.com/jinolabs-xyz/WebZjs.git}"
WEBZJS_REV="${WEBZJS_REV:-a50df944c32243cb8da9f86e7d52cb65ac926439}"
git clone "$WEBZJS_REPO" "$WORK_DIR"
cd "$WORK_DIR"
git checkout --quiet "$WEBZJS_REV"
# WebZjs pins its nightly in rust-toolchain.toml — do NOT override it.
# Building on a newer nightly produces a wasm whose async gRPC calls hang.
rustup toolchain install "$(grep -o 'nightly-[0-9-]*' rust-toolchain.toml)" \
  --component rust-src --target wasm32-unknown-unknown

# macOS: Apple clang cannot target wasm32. Prefer Homebrew LLVM, else zig cc
# (zig 0.13.0 confirmed working for the secp256k1 wasm32 build, 2026-08-03;
# brew install zig is blocked by the untrusted mongodb tap — use the
# standalone tarball from ziglang.org).
if [[ "$(uname)" == "Darwin" ]]; then
  if [[ -x /opt/homebrew/opt/llvm/bin/clang ]]; then
    export CC_wasm32_unknown_unknown=/opt/homebrew/opt/llvm/bin/clang
    export AR_wasm32_unknown_unknown=/opt/homebrew/opt/llvm/bin/llvm-ar
  elif command -v zig >/dev/null; then
    # zig cc chokes on cc-rs's --target=wasm32-unknown-unknown flag; wrap it.
    WRAP_DIR="$(mktemp -d)"
    cat > "$WRAP_DIR/zig-cc-wasm32" <<'WRAP'
#!/bin/sh
args=""
for a in "$@"; do
  case "$a" in
    --target=*) ;;
    *) args="$args \"$a\"" ;;
  esac
done
eval exec zig cc -target wasm32-freestanding $args
WRAP
    printf '#!/bin/sh\nexec zig ar "$@"\n' > "$WRAP_DIR/zig-ar"
    chmod +x "$WRAP_DIR/zig-cc-wasm32" "$WRAP_DIR/zig-ar"
    export CC_wasm32_unknown_unknown="$WRAP_DIR/zig-cc-wasm32"
    export AR_wasm32_unknown_unknown="$WRAP_DIR/zig-ar"
  else
    echo "Need a wasm32-capable C compiler: brew install llvm, or install zig" >&2
    echo "(or use: $0 --docker)" >&2
    exit 1
  fi
fi

(cd crates/webzjs-wallet && wasm-pack build -t web --release --scope chainsafe \
  --out-dir ../../packages/webzjs-wallet \
  --no-default-features --features="wasm no-bundler" \
  -Z build-std="panic_abort,std")
sh ./add-worker-module.sh || true
(cd crates/webzjs-keys && wasm-pack build -t web --release --scope chainsafe \
  --out-dir ../../packages/webzjs-keys \
  --no-default-features -Z build-std="panic_abort,std")

mkdir -p "$VENDOR_DIR"
rm -rf "$VENDOR_DIR/webzjs-wallet" "$VENDOR_DIR/webzjs-keys"
cp -r packages/webzjs-wallet "$VENDOR_DIR/webzjs-wallet"
cp -r packages/webzjs-keys "$VENDOR_DIR/webzjs-keys"
echo "✅ Vendored into $VENDOR_DIR"
