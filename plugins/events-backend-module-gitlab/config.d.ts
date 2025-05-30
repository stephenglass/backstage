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

export interface Config {
  events?: {
    modules?: {
      /**
       * events-backend-module-gitlab plugin configuration.
       */
      gitlab?: {
        /**
         * Secret token for webhook requests used to verify tokens.
         *
         * See https://docs.gitlab.com/ee/user/project/integrations/webhooks.html#validate-payloads-by-using-a-secret-token
         * for more details.
         *
         * Webhook listener will only be enabled if this is set.
         *
         * @visibility secret
         */
        webhookSecret?: string;
      };
    };
  };
}
