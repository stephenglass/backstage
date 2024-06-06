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
import { createProxyAgent, createNoProxyRules, shouldProxy } from './proxy';
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

  it('should be able to create proxy rules', async () => {
    expect(
      createNoProxyRules(
        'example-test-site.com,another-test-site.com:8080,localhost:7007,.wildcard-site.com',
      ),
    ).toMatchObject([
      { hostname: 'example-test-site.com', port: undefined },
      { hostname: 'another-test-site.com', port: 8080 },
      { hostname: 'localhost', port: 7007 },
      { hostname: '.wildcard-site.com', port: undefined },
    ]);

    expect(
      createNoProxyRules(
        '[1fff:0:a88:85a3::ac1f]:8001,[1fff:0:a88:85a3::ac1f],127.0.0.1,127.0.0.1:8080',
      ),
    ).toMatchObject([
      { hostname: '[1fff:0:a88:85a3::ac1f]', port: 8001 },
      { hostname: '[1fff:0:a88:85a3::ac1f]', port: undefined },
      { hostname: '127.0.0.1', port: undefined },
      { hostname: '127.0.0.1', port: 8080 },
    ]);
  });

  it('should be able to determine if proxying', async () => {
    // different port than was defined
    expect(
      shouldProxy('test-site.com', 443, createNoProxyRules('test-site.com:80')),
    ).toBeTruthy();

    // undefined port matches hostname
    expect(
      shouldProxy('test-site.com', 443, createNoProxyRules('test-site.com')),
    ).toBeFalsy();

    // matches port
    expect(
      shouldProxy(
        'test-site.com',
        443,
        createNoProxyRules('test-site.com:443'),
      ),
    ).toBeFalsy();

    // subdomain proxies without wildcard, undefined port
    expect(
      shouldProxy(
        'example.test-site.com',
        443,
        createNoProxyRules('test-site.com'),
      ),
    ).toBeTruthy();

    // subdomain noproxies with the wildcard, undefined port
    expect(
      shouldProxy(
        'example.test-site.com',
        443,
        createNoProxyRules('.test-site.com'),
      ),
    ).toBeFalsy();

    // test proxying with ipv4, ipv6
    const ipRules = createNoProxyRules(
      '127.0.0.1,[1fff:0:a88:85a3::ac1f]:8001,[1aaa:0:a88:85a3::ac1f]',
    );
    expect(shouldProxy('127.0.0.1', 80, ipRules)).toBeFalsy();
    expect(shouldProxy('[1fff:0:a88:85a3::ac1f]', 8001, ipRules)).toBeFalsy();
    expect(shouldProxy('[1fff:0:a88:85a3::ac1f]', 8002, ipRules)).toBeTruthy();
    expect(shouldProxy('[1aaa:0:a88:85a3::ac1f]', 443, ipRules)).toBeFalsy();
  });

  it('should be able to proxy using native & node fetch', async () => {
    await createProxyAgent({
      config: await ConfigSources.toConfig(
        StaticConfigSource.create({
          data: {
            proxy: {
              http_proxy: 'http://localhost:3000',
              https_proxy: 'http://localhost:3000',
              no_proxy: 'localhost:5051',
            },
          },
        }),
      ),
      logger: loggerToWinstonLogger(mockServices.logger.mock()),
    });

    expect(process.env.BACKSTAGE_HTTP_PROXY).toEqual('http://localhost:3000');
    expect(process.env.BACKSTAGE_HTTPS_PROXY).toEqual('http://localhost:3000');
    expect(process.env.BACKSTAGE_NO_PROXY).toEqual('localhost:5051');

    // go thru proxy - native fetch
    expect(
      (
        (await getError(async () =>
          undiciFetch('http://localhost:5050'),
        )) as Error
      ).cause,
    ).toMatchObject({
      address: '::1',
      port: 3000,
    });

    // no proxy - native fetch
    expect(
      (
        (await getError(async () =>
          undiciFetch('http://localhost:5051'),
        )) as Error
      ).cause,
    ).toMatchObject({
      address: '::1',
      port: 5051,
    });

    // go thru proxy - node fetch
    expect(
      (
        (await getError(async () =>
          nodeFetch('http://localhost:5050'),
        )) as Error
      ).message,
    ).toContain('::1:3000');

    // no proxy - node fetch
    expect(
      (
        (await getError(async () =>
          nodeFetch('http://localhost:5051'),
        )) as Error
      ).message,
    ).toContain('::1:5051');
  });
});
