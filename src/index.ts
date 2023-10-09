import type { Config } from 'payload/config'
import { OAuthManager } from './fields/oauth-manager'
import { OAuthApps } from './collections/OAuthApps'
import type { EndpointConfig, PluginConfig } from './types'
import { OAuthGroup } from './fields/oauth-group'
import { oAuthEndpoints } from './endpoints/oauth'
export { oAuthManager } from './fields/oauth-manager'

export const oAuthStrategy =
  (pluginConfig: PluginConfig) =>
  (config: Config): Config => {
    return {
      ...config,
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
    }
  }

export default oAuthStrategy
