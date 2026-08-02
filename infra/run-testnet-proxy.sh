#!/usr/bin/env bash
# Runs a local gRPC-web proxy in front of the public Zcash testnet
# lightwalletd (testnet.zec.rocks:443). Browsers can't speak raw gRPC, so
# WebZjs needs this proxy. Serves plaintext HTTP on localhost:8080.
#
# Install grpcwebproxy if missing:
#   go install github.com/improbable-eng/grpc-web/go/grpcwebproxy@latest
set -euo pipefail

PORT="${PORT:-8080}"
BACKEND="${BACKEND:-testnet.zec.rocks:443}"

if ! command -v grpcwebproxy >/dev/null; then
  if command -v go >/dev/null; then
    echo "Installing grpcwebproxy…"
    go install github.com/improbable-eng/grpc-web/go/grpcwebproxy@latest
    export PATH="$PATH:$(go env GOPATH)/bin"
  else
    echo "grpcwebproxy not found and Go is not installed." >&2
    echo "Install Go, then: go install github.com/improbable-eng/grpc-web/go/grpcwebproxy@latest" >&2
    exit 1
  fi
fi

echo "Proxying http://localhost:$PORT → grpc://$BACKEND"
exec grpcwebproxy \
  --backend_addr="$BACKEND" \
  --backend_tls \
  --backend_max_call_recv_msg_size=10485760 \
  --server_http_max_write_timeout=1000s \
  --server_http_max_read_timeout=1000s \
  --run_tls_server=false \
  --allow_all_origins \
  --server_http_debug_port "$PORT"
