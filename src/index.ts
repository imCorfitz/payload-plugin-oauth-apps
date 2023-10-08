import type { Config } from 'payload/config'
import { OAuthManager } from './fields/oauth-manager'
import { OAuthApps } from './collections/OAuthApps'
import type { EndpointConfig, PluginConfig } from './types'
import { OAuthGroup } from './fields/oauth-group'
import { oAuthEndpoints } from './endpoints/oauth'

export const oAuthStrategy =
  (pluginConfig: PluginConfig) =>
  (config: Config): Config => {
    return {
      ...config,
      // admin: {
      //   ...config.admin,
      //   webpack: webpackConfig => {
      //     const conf = config.admin?.webpack?.(webpackConfig) || webpackConfig
      //     return {
      //       ...conf,
      //       resolve: {
      //         ...conf.resolve,
      //         alias: {
      //           ...conf.resolve?.alias,
      //           jsonwebtoken: false,
      //         },
      //       },
      //     }
      //   },
      // },
      collections: [
        ...(config.collections || []).map(collection => {
          const { slug } = collection

          const isAdminCollection =
            pluginConfig.adminCollection && pluginConfig.adminCollection === slug

          /**
           * If the adminCollection is set, add the OAuthManager field to that collection
           */
          if (isAdminCollection) {
            collection.fields = [...collection.fields, OAuthManager]
          }

          const isUserCollection = pluginConfig.userCollections.includes(slug)

          if (isUserCollection) {
            /**
             * If the adminCollection is not set, add the OAuthManager field to the userCollection
             */
            if (!pluginConfig.adminCollection) {
              collection.fields = [...collection.fields, OAuthManager]
            }

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
    }
  }

export default oAuthStrategy
