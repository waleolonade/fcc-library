/**
 * Multi-Worker PHP Backend Load Balancer for FCC Library (Ports 8010 & 8000)
 * Spawns 6 concurrent PHP built-in servers (127.0.0.1:8011..8016) so concurrent
 * Live Classroom requests (/start, /end, /frame, /chunk, /signal, /chat, /active, /realtime/stream)
 * never block or queue behind a single-threaded PHP process on Windows.
 */
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PRIMARY_PORT = parseInt(process.env.PORT || '8010', 10);
const LEGACY_PORT = 8000;
const LISTEN_HOST = process.env.HOST || '0.0.0.0';
const WORKER_PORTS = [8011, 8012, 8013, 8014, 8015, 8016];

const backendDir = path.resolve(__dirname, '..', 'backend');
const publicDir = path.join(backendDir, 'public');
const routerScript = path.join(publicDir, 'index.php');

const phpCandidates = [
  'C:\\xampp\\php\\php.exe',
  'php'
];
const PHP_BIN = phpCandidates.find(p => p === 'php' || fs.existsSync(p)) || 'php';

// Ensure XAMPP MySQL is running
function ensureMysqlRunning() {
  const mysqlBin = 'C:\\xampp\\mysql\\bin\\mysqld.exe';
  const mysqlIni = 'C:\\xampp\\mysql\\bin\\my.ini';
  if (!fs.existsSync(mysqlBin)) return;

  const sock = new net.Socket();
  sock.setTimeout(300);
  sock.once('connect', () => {
    sock.destroy();
  });
  sock.once('error', () => {
    sock.destroy();
    try {
      const child = spawn(mysqlBin, [`--defaults-file=${mysqlIni}`, '--standalone'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref();
    } catch (e) {}
  });
  sock.once('timeout', () => {
    sock.destroy();
  });
  sock.connect(3306, '127.0.0.1');
}

ensureMysqlRunning();

const workers = new Map();
let rrIndex = 0;

function spawnWorker(port) {
  const existing = workers.get(port);
  if (existing && existing.proc && !existing.proc.killed) {
    try { existing.proc.kill(); } catch (e) {}
  }

  const args = [
    '-d', 'upload_max_filesize=256M',
    '-d', 'post_max_size=256M',
    '-d', 'memory_limit=512M',
    '-d', 'max_execution_time=60',
    '-S', `127.0.0.1:${port}`,
    '-t', publicDir,
    routerScript
  ];

  const proc = spawn(PHP_BIN, args, {
    cwd: backendDir,
    stdio: ['ignore', 'ignore', 'ignore'],
    windowsHide: true
  });

  const workerState = {
    port,
    proc,
    busy: 0,
    healthy: true,
    spawnedAt: Date.now()
  };

  proc.on('exit', () => {
    workerState.healthy = false;
    setTimeout(() => spawnWorker(port), 500);
  });

  proc.on('error', () => {
    workerState.healthy = false;
    setTimeout(() => spawnWorker(port), 1000);
  });

  workers.set(port, workerState);
  return workerState;
}

WORKER_PORTS.forEach(port => spawnWorker(port));

function pickLeastBusyWorker() {
  let best = null;
  for (let i = 0; i < WORKER_PORTS.length; i++) {
    const idx = (rrIndex + i) % WORKER_PORTS.length;
    const w = workers.get(WORKER_PORTS[idx]);
    if (!w || !w.healthy) continue;
    if (!best || w.busy < best.busy) {
      best = w;
      if (w.busy === 0) {
        rrIndex = (idx + 1) % WORKER_PORTS.length;
        break;
      }
    }
  }
  if (!best) {
    const fallbackPort = WORKER_PORTS[rrIndex % WORKER_PORTS.length];
    rrIndex = (rrIndex + 1) % WORKER_PORTS.length;
    best = workers.get(fallbackPort) || spawnWorker(fallbackPort);
  }
  return best;
}

function handleProxyRequest(clientReq, clientRes) {
  const worker = pickLeastBusyWorker();
  worker.busy++;

  let finished = false;
  const decrementBusy = () => {
    if (!finished) {
      finished = true;
      worker.busy = Math.max(0, worker.busy - 1);
    }
  };

  const options = {
    hostname: '127.0.0.1',
    port: worker.port,
    path: clientReq.url,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: clientReq.headers.host || `127.0.0.1:${PRIMARY_PORT}`
    },
    timeout: 20000
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(clientRes);
    proxyRes.on('end', decrementBusy);
    proxyRes.on('error', decrementBusy);
  });

  proxyReq.on('timeout', () => {
    decrementBusy();
    proxyReq.destroy();
    spawnWorker(worker.port);
    if (!clientRes.headersSent) {
      clientRes.writeHead(504, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ success: false, error: 'Backend worker timed out and was recycled.' }));
    }
  });

  proxyReq.on('error', (err) => {
    decrementBusy();
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ success: false, error: 'Backend worker restarting, please retry.', details: err.message }));
    }
  });

  clientReq.pipe(proxyReq);
  clientReq.on('error', () => {
    decrementBusy();
    proxyReq.destroy();
  });
}

const primaryServer = http.createServer(handleProxyRequest);
primaryServer.on('error', (err) => {
  console.error(`[multi-php-server] Primary port ${PRIMARY_PORT} notice:`, err.message);
});
primaryServer.listen(PRIMARY_PORT, LISTEN_HOST, () => {
  console.log(`[multi-php-server] Listening on http://${LISTEN_HOST}:${PRIMARY_PORT} across ${WORKER_PORTS.length} PHP workers (${WORKER_PORTS.join(', ')})`);
});

if (PRIMARY_PORT !== LEGACY_PORT) {
  const legacyServer = http.createServer(handleProxyRequest);
  legacyServer.on('error', () => {
    // Port 8000 already bound by another process; primary port 8010 handles Vite traffic
  });
  legacyServer.listen(LEGACY_PORT, LISTEN_HOST, () => {
    console.log(`[multi-php-server] Also listening on http://${LISTEN_HOST}:${LEGACY_PORT}`);
  });
}
