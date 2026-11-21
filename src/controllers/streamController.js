import {
  onRoundEvent,
  getEngineState,
  getEngineHistory
} from '../services/roundEngineService.js';

import {
  getIntervalState
} from '../services/intervalEngineService.js';

const clients = new Set();

let multiplierTimer = null;
let heartbeatTimer = null;
let unsubscribeEngine = null;

function sendEvent(res, event, data) {
  if (res.destroyed || res.writableEnded) return;

  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (error) {
    console.error('SSE transmission error:', error.message);
  }
}

function broadcast(event, data) {
  for (const client of clients) {
    sendEvent(client, event, data);
  }
}

function startBroadcasting() {
  if (multiplierTimer) return;

  unsubscribeEngine = onRoundEvent((event) => {
    broadcast('ROUND_EVENT', event);

    if (
      event.type === 'ROUND_STARTED' ||
      event.type === 'ROUND_FINISHED'
    ) {
      broadcast('INTERVAL_UPDATE', getIntervalState());
    }
  });

  multiplierTimer = setInterval(() => {
    broadcast('MULTIPLIER_UPDATE', getEngineState());
  }, 100);

  heartbeatTimer = setInterval(() => {
    for (const client of clients) {
      if (!client.destroyed && !client.writableEnded) {
        client.write(': heartbeat\n\n');
      }
    }
  }, 20000);
}

function stopBroadcasting() {
  if (clients.size > 0) return;

  if (multiplierTimer) {
    clearInterval(multiplierTimer);
    multiplierTimer = null;
  }

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  if (unsubscribeEngine) {
    unsubscribeEngine();
    unsubscribeEngine = null;
  }
}

export function streamEngine(req, res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.flushHeaders?.();

  res.write('retry: 3000\n\n');

  clients.add(res);

  sendEvent(res, 'INITIAL_STATE', {
    engine: getEngineState(),
    history: getEngineHistory(),
    intervals: getIntervalState()
  });

  startBroadcasting();

  res.on('close', () => {
    clients.delete(res);
    stopBroadcasting();
  });
}

export function getStreamStats() {
  return {
    connectedClients: clients.size,
    broadcasting: Boolean(multiplierTimer)
  };
}
