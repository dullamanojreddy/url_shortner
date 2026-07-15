import client from "prom-client";


export const register = new client.Registry();


client.collectDefaultMetrics({
  register,
});


export const redirectLatency = new client.Histogram({
  name: "redirect_latency_ms",
  help: "Redirect latency in ms",
  buckets: [
    5,
    10,
    25,
    50,
    100,
    250,
    500
  ],
  registers: [register],
});


export const cacheHits = new client.Counter({
  name: "redirect_cache_hits_total",
  help: "Total cache hits",
  registers: [register],
});


export const cacheMisses = new client.Counter({
  name: "redirect_cache_misses_total",
  help: "Total cache misses",
  registers: [register],
});