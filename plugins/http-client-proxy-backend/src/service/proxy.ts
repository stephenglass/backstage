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
import {
  setGlobalDispatcher,
  EnvHttpProxyAgent,
  getGlobalDispatcher,
  Dispatcher,
  ProxyAgent,
} from 'undici';

export interface ProxyOptions {
  logger: Logger;
  config: Config;
}

const getProxyAgent = (proto: string) => {
  let agent: ProxyAgent | undefined;

  if (proto !== 'http' && proto !== 'https') {
    return agent;
  }

  if (proto === 'http') {
    agent = process.env.BACKSTAGE_HTTPS_PROXY
      ? new ProxyAgent(process.env.BACKSTAGE_HTTPS_PROXY)
      : undefined;
  }

  if (!agent) {
    agent = process.env.BACKSTAGE_HTTP_PROXY
      ? new ProxyAgent(process.env.BACKSTAGE_HTTP_PROXY)
      : undefined;
  }
  return agent;
};

export async function createProxyAgent(configOptions: ProxyOptions) {
  // Read existing environment variables
  const userConfig = {
    httpProxy: configOptions.config
      .getOptionalConfig('proxy.http_proxy')
      ?.get<string>(),
    httpsProxy: configOptions.config
      .getOptionalConfig('proxy.https_proxy')
      ?.get<string>(),
    noProxy: configOptions.config
      .getOptionalConfig('proxy.no_proxy')
      ?.get<string>(),
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

  // Global agent configures proxy agent used by node fetch requests globally
  bootstrap({ environmentVariableNamespace: 'BACKSTAGE_' });

  // const envHttpProxyAgent = new EnvHttpProxyAgent({
  //   httpProxy: process.env.BACKSTAGE_HTTP_PROXY,
  //   httpsProxy: process.env.BACKSTAGE_HTTPS_PROXY,
  //   noProxy: process.env.BACKSTAGE_NO_PROXY,
  // });

  // Create a default dispatcher
  const defaultDispatcher = getGlobalDispatcher();

  const noProxyRules = (process.env.BACKSTAGE_NO_PROXY ?? '')
    .split(',')
    .map(rule => rule.trim());

  setGlobalDispatcher(
    new (class extends Dispatcher {
      dispatch(
        options: Dispatcher.DispatchOptions,
        handler: Dispatcher.DispatchHandlers,
      ) {
        if (options.origin) {
          const { host, protocol } =
            typeof options.origin === 'string'
              ? new URL(options.origin)
              : options.origin;
          if (
            !noProxyRules.some(
              rule =>
                rule === '*' ||
                (rule.startsWith('.') ? host.endsWith(rule) : host === rule),
            )
          ) {
            const proxyAgent = getProxyAgent(protocol);
            if (proxyAgent) {
              proxyAgent.dispatch(options, handler);
            }
          }
        }
        return defaultDispatcher.dispatch(options, handler);
      }
    })(),
  );
}
