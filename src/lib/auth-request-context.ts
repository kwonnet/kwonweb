import {createHmac} from 'node:crypto';
import {isIP} from 'node:net';
// Only enable an IP header when the ingress overwrites it and origin bypass is
// restricted. By default IP/location are unknown rather than trusting arbitrary XFF.
export function authRequestContextHeaders(headers: Pick<Headers, 'get'>): Record<string, string> {
  const key = process.env.AUTH_TELEMETRY_SHARED_SECRET;
  if (!key || key.length < 32) return {};
  const configuredHeader = process.env.AUTH_TRUSTED_WEB_IP_HEADER;
  const candidate = configuredHeader ? headers.get(configuredHeader)?.trim().replace(/^::ffff:/i, '') : null;
  const ip = candidate && isIP(candidate) ? candidate : null;
  const body = Buffer.from(JSON.stringify({at: Date.now(), ip, agent: (headers.get('user-agent') ?? '').slice(0, 1024)})).toString('base64url');
  return {'x-kwonnet-auth-context': body, 'x-kwonnet-auth-signature': createHmac('sha256', key).update(body).digest('hex')};
}
