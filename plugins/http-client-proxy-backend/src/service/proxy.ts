/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Config } from '@backstage/config';
import { Logger } from 'winston';
import { bootstrap } from 'global-agent';
import { setGlobalDispatcher, Dispatcher, ProxyAgent, Agent } from 'undici';

export interface ProxyOptions {
  logger: Logger;
  config: Config;
}

interface ProxyRule {
  hostname: string;
  port?: number;
}

const DEFAULT_PORTS: { [key: string]: number } = {
  http: 80,
  https: 443,
};

function getProxyAgent(proto: string): ProxyAgent | undefined {
  if (proto !== 'http' && proto !== 'https') {
    return undefined;
  }

  // https is optional
  // do http over https if it's specified as an option
  if (proto === 'http' && process.env.BACKSTAGE_HTTPS_PROXY) {
    return new ProxyAgent(process.env.BACKSTAGE_HTTPS_PROXY);
  }

  // proto is https or https isn't specified. get agent for http proxy
  return process.env.BACKSTAGE_HTTP_PROXY
    ? new ProxyAgent(process.env.BACKSTAGE_HTTP_PROXY)
    : undefined;
}

export function createNoProxyRules(noProxyValue: string): ProxyRule[] {
  return noProxyValue
    .split(',')
    .map(rule => rule.trim())
    .filter(rule => rule.length > 0)
    .map(entry => {
      const parsed = entry.match(/^(.+):(\d+)$/);
      return {
        hostname: (parsed ? parsed[1] : entry).toLowerCase(),
        port: parsed ? Number.parseInt(parsed[2], 10) : undefined,
      };
    });
}

export function shouldProxy(
  hostname: string,
  port: number | undefined,
  rules: ProxyRule[],
): boolean {
  if (rules.length === 0) {
    // Always proxy if NO_PROXY is not set or empty.
    return true;
  }

  for (const entry of rules) {
    if (entry.port && entry.port !== port) {
      // Skip if ports don't match
      continue;
    }

    if (!/^[.*]/.test(entry.hostname)) {
      // No wildcards, so don't proxy only if there is not an exact match.
      if (hostname === entry.hostname) {
        return false;
      }
    } else if (hostname.endsWith(entry.hostname.replace(/^\*/, ''))) {
      // Don't proxy if the hostname ends with the no_proxy host.
      return false;
    }
  }

  return true;
}

export async function createProxyAgent(configOptions: ProxyOptions) {
  // Read existing environment variables

  const userConfig = {
    httpProxy: configOptions.config.getOptionalString('proxy.http_proxy'),
    httpsProxy: configOptions.config.getOptionalString('proxy.https_proxy'),
    noProxy: configOptions.config.getOptionalString('proxy.no_proxy'),
  };

  // Set environment variables based on user config
  // If user config is not provided, it will use existing environment variables
  if (userConfig.httpProxy) {
    process.env.BACKSTAGE_HTTP_PROXY = userConfig.httpProxy;
  }

  if (userConfig.httpsProxy) {
    process.env.BACKSTAGE_HTTPS_PROXY = userConfig.httpsProxy;
  }

  if (userConfig.noProxy) {
    process.env.BACKSTAGE_NO_PROXY = userConfig.noProxy;
  }

  const noProxyValue = process.env.BACKSTAGE_NO_PROXY ?? '';

  if (noProxyValue === '*') {
    // Never proxy if NO_PROXY wildcard is set
    // Return here so the proxy is never configured
    return;
  }

  // Global agent configures proxy agent used by node fetch requests globally
  bootstrap({ environmentVariableNamespace: 'BACKSTAGE_' });

  // Create rules from the value
  const noProxyRules = createNoProxyRules(noProxyValue);

  // Create a default dispatcher
  const defaultDispatcher = new Agent();

  setGlobalDispatcher(
    new (class extends Dispatcher {
      dispatch(
        options: Dispatcher.DispatchOptions,
        handler: Dispatcher.DispatchHandlers,
      ) {
        if (options.origin) {
          const { host, protocol, port } =
            typeof options.origin === 'string'
              ? new URL(options.origin)
              : options.origin;

          const nProto = protocol.endsWith(':')
            ? protocol.slice(0, -1)
            : protocol;

          // Stripping ports in this way instead of using parsedUrl.hostname to make
          // sure that the brackets around IPv6 addresses are kept.
          const nHost = host.replace(/:\d*$/, '').toLowerCase();

          const nPort =
            Number.parseInt(port, 10) || DEFAULT_PORTS[protocol] || undefined;

          if (shouldProxy(nHost, nPort, noProxyRules)) {
            const proxyAgent = getProxyAgent(nProto);
            if (proxyAgent) {
              return proxyAgent.dispatch(options, handler);
            }
          }
        }

        return defaultDispatcher.dispatch(options, handler);
      }
    })(),
  );

  configOptions.logger.info('Configured proxy settings for http clients');
}
