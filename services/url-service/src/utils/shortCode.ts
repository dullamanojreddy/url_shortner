/**
 * Base62 Snowflake-style short code generator.
 *
 * Snowflake ID = 41 bits timestamp + 10 bits machine ID + 12 bits sequence
 * Then Base62-encoded to 7–11 characters.
 */

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const EPOCH = 1700000000000n; // custom epoch Nov 2023
const MACHINE_ID = BigInt(Math.floor(Math.random() * 1023));

let sequence = 0n;
let lastTimestamp = -1n;

function snowflakeId(): bigint {
  let ts = BigInt(Date.now()) - EPOCH;
  if (ts === lastTimestamp) {
    sequence = (sequence + 1n) & 4095n;
    if (sequence === 0n) {
      // wait for next millisecond
      while (BigInt(Date.now()) - EPOCH <= ts) {}
      ts = BigInt(Date.now()) - EPOCH;
    }
  } else {
    sequence = 0n;
  }
  lastTimestamp = ts;
  return (ts << 22n) | (MACHINE_ID << 12n) | sequence;
}

export function generateShortCode(): string {
  let id = snowflakeId();
  let code = "";
  while (id > 0n) {
    code = BASE62[Number(id % 62n)] + code;
    id = id / 62n;
  }
  return code.slice(0, 8); // keep 8 chars
}

export function expiryToDate(expiry?: string): Date | null {
  if (!expiry) return null;
  const map: Record<string, number> = { "7d": 7, "30d": 30, "365d": 365 };
  const days = map[expiry];
  if (!days) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
