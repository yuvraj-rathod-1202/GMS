#!/bin/bash
set -euo pipefail

python -u worker.py &
WORKER_PID=$!

uvicorn server:app --host 0.0.0.0 --port 7000 &
UVICORN_PID=$!

trap "kill -TERM ${WORKER_PID} ${UVICORN_PID}" SIGTERM SIGINT

wait -n ${WORKER_PID} ${UVICORN_PID}
EXIT_CODE=$?
kill -TERM ${WORKER_PID} ${UVICORN_PID} 2>/dev/null || true
wait ${WORKER_PID} ${UVICORN_PID} 2>/dev/null || true
exit ${EXIT_CODE}