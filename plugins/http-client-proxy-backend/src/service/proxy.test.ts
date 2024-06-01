/*
 * Copyright 2022 The Backstage Authors
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

import { loggerToWinstonLogger } from '@backstage/backend-common';
import { ConfigSources, StaticConfigSource } from '@backstage/config-loader';
import { mockServices } from '@backstage/backend-test-utils';
import { createProxyAgent } from './proxy';
import { fetch as undiciFetch } from 'undici';
import { default as nodeFetch } from 'node-fetch';

// https://github.com/jest-community/eslint-plugin-jest/blob/v27.9.0/docs/rules/no-conditional-expect.md
class NoErrorThrownError extends Error {}

const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try {
    await call();

    throw new NoErrorThrownError();
  } catch (error: unknown) {
    return error as TError;
  }
};

describe('Requests are routed via proxy', () => {
  beforeEach(() => {
    process.env.BACKSTAGE_HTTP_PROXY = undefined;
    process.env.BACKSTAGE_HTTPS_PROXY = undefined;
    process.env.BACKSTAGE_NO_PROXY = undefined;
  });

  it('should be able to proxy using native fetch', async () => {
    await createProxyAgent({
      config: await ConfigSources.toConfig(
        StaticConfigSource.create({
          data: {
            proxy: {
              http_proxy: 'http://localhost:3000',
              https_proxy: 'http://localhost:3000',
            },
          },
        }),
      ),
      logger: loggerToWinstonLogger(mockServices.logger.mock()),
    });

    const error: Error = await getError(async () =>
      undiciFetch('http://localhost:5050'),
    );

    expect(error.cause).toMatchObject({
      address: '::1',
      port: 3000,
    });
  });

  it('should be able to no proxy using native fetch', async () => {
    await createProxyAgent({
      config: await ConfigSources.toConfig(
        StaticConfigSource.create({
          data: {
            proxy: {
              http_proxy: 'http://localhost:3000',
              https_proxy: 'http://localhost:3000',
              no_proxy: 'localhost:5050',
            },
          },
        }),
      ),
      logger: loggerToWinstonLogger(mockServices.logger.mock()),
    });

    const error: Error = await getError(async () =>
      undiciFetch('http://localhost:5050'),
    );

    expect(error.cause).toMatchObject({
      address: '::1',
      port: 5050,
    });
  });

  it('should be able to no proxy using native fetch default http port', async () => {
    await createProxyAgent({
      config: await ConfigSources.toConfig(
        StaticConfigSource.create({
          data: {
            proxy: {
              http_proxy: 'http://localhost:3000',
              https_proxy: 'http://localhost:3000',
              no_proxy: 'localhost',
            },
          },
        }),
      ),
      logger: loggerToWinstonLogger(mockServices.logger.mock()),
    });

    const error: Error = await getError(async () =>
      undiciFetch('http://localhost'),
    );

    expect(error.cause).toMatchObject({
      address: '::1',
      port: 80,
    });
  });

  it('should be able to no proxy using native fetch default https port', async () => {
    await createProxyAgent({
      config: await ConfigSources.toConfig(
        StaticConfigSource.create({
          data: {
            proxy: {
              http_proxy: 'http://localhost:3000',
              https_proxy: 'http://localhost:3000',
              no_proxy: 'localhost',
            },
          },
        }),
      ),
      logger: loggerToWinstonLogger(mockServices.logger.mock()),
    });

    const error: Error = await getError(async () =>
      undiciFetch('https://localhost'),
    );

    expect(error.cause).toMatchObject({
      address: '::1',
      port: 443,
    });
  });

  it('should be able to proxy using node fetch', async () => {
    await createProxyAgent({
      config: await ConfigSources.toConfig(
        StaticConfigSource.create({
          data: {
            proxy: {
              http_proxy: 'http://localhost:3000',
              https_proxy: 'http://localhost:3000',
            },
          },
        }),
      ),
      logger: loggerToWinstonLogger(mockServices.logger.mock()),
    });

    const error: Error = await getError(async () =>
      nodeFetch('http://localhost:5050'),
    );

    expect(error.message).toContain('::1:3000');
  });

  it('should be able to no proxy using node fetch', async () => {
    await createProxyAgent({
      config: await ConfigSources.toConfig(
        StaticConfigSource.create({
          data: {
            proxy: {
              http_proxy: 'http://localhost:3000',
              https_proxy: 'http://localhost:3000',
              no_proxy: 'localhost:5050',
            },
          },
        }),
      ),
      logger: loggerToWinstonLogger(mockServices.logger.mock()),
    });

    const error: Error = await getError(async () =>
      nodeFetch('http://localhost:5050'),
    );

    expect(error.message).toContain('::1:3000');
  });
});
