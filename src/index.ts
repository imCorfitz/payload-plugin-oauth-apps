import type { Config } from 'payload/config'
import { OAuthApps } from './collections/OAuthApps'
import type { EndpointConfig, PluginConfig } from './types'
import { OAuthGroup } from './fields/oauth-group'
import { oAuthEndpoints } from './endpoints/oauth'
import oAuthCorsHeaders from './express/middleware/cors'
import oAuthCsrf from './express/middleware/csrf'

export { oAuthManager } from './fields/oauth-manager'

export const oAuthApps =
  (pluginConfig: PluginConfig) =>
  (config: Config): Config => {
    return {
      ...config,
      admin: {
        ...config.admin,
        webpack: webpackConfig => {
          const conf = config.admin?.webpack?.(webpackConfig) || webpackConfig
          return {
            ...conf,
            resolve: {
              ...conf.resolve,
              alias: {
                ...conf.resolve?.alias,
                jsonwebtoken: false,
              },
            },
          }
        },
      },
      collections: [
        ...(config.collections || []).map(collection => {
          const { slug } = collection

          const isUserCollection = pluginConfig.userCollections.includes(slug)

          if (isUserCollection) {
            /**
             * Update users collection to manage their sessions
             */
            collection.fields = [...collection.fields, OAuthGroup(pluginConfig)]

            const endpointConfig: EndpointConfig = {
              ...pluginConfig,
              endpointCollection: collection,
            }

            /**
             * Add OAuth endpoints to the users collection
             */
            collection.endpoints = [
              ...(collection.endpoints || []),
              ...oAuthEndpoints(endpointConfig),
            ]
          }

          return collection
        }),
        OAuthApps,
      ],

      /**
       * Add OAuth Apps CORS headers to the express app
       */
      express: {
        preMiddleware: [oAuthCsrf],
        postMiddleware: [oAuthCorsHeaders],
      },
    }
  }
