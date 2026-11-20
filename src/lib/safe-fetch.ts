import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { BlockList, isIP } from "node:net";
import { Agent, fetch as undiciFetch } from "undici";

// IANA special-purpose ranges that must never be fetched on a user's behalf.
const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(network, prefix, "ipv4");
// IPv4-mapped (::ffff:0:0/96) and NAT64 (64:ff9b::/96) addresses are not listed:
// BlockList matches IPv4 checks against the mapped form, so listing them would
// block every IPv4 address. isPrivateIp unwraps both and checks the IPv4 inside.
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["fc00::", 7],
  ["fe80::", 10],
  ["fec0::", 10],
  ["ff00::", 8],
] as const)
  blocked.addSubnet(network, prefix, "ipv6");

function expandIpv6(address: string): number[] | null {
  let value = address.toLowerCase();
  const dotted = value.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted) {
    const parts = dotted[1].split(".").map(Number);
    if (parts.some((part) => part > 255)) return null;
    const high = ((parts[0] << 8) | parts[1]).toString(16);
    const low = ((parts[2] << 8) | parts[3]).toString(16);
    value = `${value.slice(0, -dotted[1].length)}${high}:${low}`;
  }
  const halves = value.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  const numbers = groups.map((group) => Number.parseInt(group, 16));
  return numbers.length === 8 && numbers.every((n) => n >= 0 && n <= 0xffff)
    ? numbers
    : null;
}

/** Returns the IPv4 address embedded in an IPv4-mapped or NAT64 IPv6 address. */
function embeddedIpv4(address: string): string | null {
  const groups = expandIpv6(address);
  if (!groups) return null;
  const mapped = groups.slice(0, 5).every((n) => n === 0) && groups[5] === 0xffff;
  const nat64 =
    groups[0] === 0x64 &&
    groups[1] === 0xff9b &&
    groups.slice(2, 6).every((n) => n === 0);
  if (!mapped && !nat64) return null;
  return [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join(".");
}

/** True for anything that is not a plain public unicast IP address. */
export function isPrivateIp(raw: string) {
  const address = raw.replace(/^\[|\]$/g, "").split("%")[0];
  const version = isIP(address);
  if (version === 4) return blocked.check(address, "ipv4");
  if (version !== 6) return true;
  const embedded = embeddedIpv4(address);
  if (embedded && blocked.check(embedded, "ipv4")) return true;
  return blocked.check(address, "ipv6");
}

type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;
type Resolver = (
  hostname: string,
  callback: (error: NodeJS.ErrnoException | null, records: LookupAddress[]) => void,
) => void;

const systemResolver: Resolver = (hostname, callback) =>
  dnsLookup(hostname, { all: true }, callback);

/**
 * A socket `lookup` that refuses private addresses at connect time, so a host
 * cannot pass the up-front check and then re-resolve to an internal address.
 */
export function createGuardedLookup(resolve: Resolver = systemResolver) {
  return (
    hostname: string,
    options: { all?: boolean } | number | undefined,
    callback: LookupCallback,
  ) => {
    resolve(hostname, (error, records) => {
      if (error) return callback(error, []);
      if (!records.length || records.some((record) => isPrivateIp(record.address))) {
        const blockedError: NodeJS.ErrnoException = new Error(
          `Refusing to connect to a private address for ${hostname}`,
        );
        blockedError.code = "EPRIVATEADDRESS";
        return callback(blockedError, []);
      }
      if (typeof options === "object" && options?.all) return callback(null, records);
      callback(null, records[0].address, records[0].family);
    });
  };
}

const publicOnlyAgent = new Agent({
  connect: { lookup: createGuardedLookup() as never },
});

/**
 * fetch() that can only reach public IP addresses. Hostnames are checked when
 * the socket connects; IP literals skip DNS, so they are checked here. Redirects
 * are never followed automatically: callers must re-check each hop themselves.
 */
export async function safeFetch(
  url: string | URL,
  init: Parameters<typeof undiciFetch>[1] = {},
) {
  const target = new URL(url);
  const host = target.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && isPrivateIp(host))
    throw new Error(`Refusing to connect to private address ${host}`);
  return undiciFetch(target, {
    ...init,
    redirect: init.redirect === "error" ? "error" : "manual",
    dispatcher: publicOnlyAgent,
  });
}

export type SafeResponse = Awaited<ReturnType<typeof safeFetch>>;

/** Reads at most `maxBytes` of a response body as text, then stops the download. */
export async function readCapped(
  response: { body: { getReader(): ReadableStreamDefaultReader<Uint8Array> } | null },
  maxBytes: number,
) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    const room = maxBytes - received;
    const chunk = value.byteLength > room ? value.subarray(0, room) : value;
    chunks.push(chunk);
    received += chunk.byteLength;
  }
  await reader.cancel().catch(() => undefined);
  return new TextDecoder().decode(Buffer.concat(chunks));
}
