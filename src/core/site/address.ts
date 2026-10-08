// Schutz gegen SSRF: Nur öffentliche Unicast-Adressen sind als Ziel erlaubt.
// Geprüft wird jede aufgelöste Adresse, auch nach Weiterleitungen; die Verbindung nutzt genau die geprüfte Adresse.

import { BlockList, isIP } from "node:net";

const BLOCKED_V4: [string, number][] = [
  ["0.0.0.0", 8], // "dieses Netz"
  ["10.0.0.0", 8], // privat
  ["100.64.0.0", 10], // Carrier-Grade NAT
  ["127.0.0.0", 8], // Loopback
  ["169.254.0.0", 16], // Link-Local, u. a. Cloud-Metadaten
  ["172.16.0.0", 12], // privat
  ["192.0.0.0", 24], // IETF-Protokollzuweisungen
  ["192.0.2.0", 24], // Dokumentation
  ["192.88.99.0", 24], // 6to4-Relay
  ["192.168.0.0", 16], // privat
  ["198.18.0.0", 15], // Benchmark
  ["198.51.100.0", 24], // Dokumentation
  ["203.0.113.0", 24], // Dokumentation
  ["224.0.0.0", 4], // Multicast
  ["240.0.0.0", 4], // reserviert und Broadcast
];

// IPv6: erlaubt ist nur globaler Unicast (2000::/3) ohne Sonderbereiche. Loopback, Link-Local,
// Unique-Local, Multicast sowie IPv4-eingebettete Adressen (::ffff:0:0/96, 64:ff9b::/96) liegen außerhalb und sind damit gesperrt.
const BLOCKED_V6: [string, number][] = [
  ["2001::", 32], // Teredo (eingebettete IPv4-Adresse)
  ["2001:db8::", 32], // Dokumentation
  ["2002::", 16], // 6to4 (eingebettete IPv4-Adresse)
];

const v4 = new BlockList();
for (const [net, prefix] of BLOCKED_V4) v4.addSubnet(net, prefix, "ipv4");
const v6Global = new BlockList();
v6Global.addSubnet("2000::", 3, "ipv6");
const v6Blocked = new BlockList();
for (const [net, prefix] of BLOCKED_V6) v6Blocked.addSubnet(net, prefix, "ipv6");

/** true nur für öffentliche Unicast-Adressen (IPv4 oder IPv6). Ungültige Eingaben sind nicht erlaubt. */
export function isPublicAddress(address: string): boolean {
  const ip = address.replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  const family = isIP(ip);
  if (family === 4) return !v4.check(ip, "ipv4");
  if (family === 6) return v6Global.check(ip, "ipv6") && !v6Blocked.check(ip, "ipv6");
  return false;
}
