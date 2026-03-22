export function getHealth(_req, res) {
  res.json({
    status: "ok",
    service: "educa-server",
    timestamp: new Date().toISOString(),
  });
}

