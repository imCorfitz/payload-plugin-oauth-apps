import type { Config } from 'payload/config'

import { OAuthApps } from './collections/OAuthApps'
import { oAuthEndpoints } from './endpoints/oauth'
import oAuthCorsHeaders from './express/middleware/cors'
import oAuthCsrf from './express/middleware/csrf'
import { OAuthGroup } from './fields/oauth-group'
import { beforeLoginOperationHook } from './hooks/before-login'
import { beforeRefreshOperationHook } from './hooks/before-refresh'
import type { OperationConfig, PluginTypes } from './types'
import { extendWebpackConfig } from './webpack'
import { onInitExtension } from './onInitExtension'

export const oAuthApps =
  (pluginOptions: PluginTypes) =>
  (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }

    const webpack = extendWebpackConfig(incomingConfig)

    config.admin = {
      ...(config.admin || {}),
      webpack,
    }

    // If the plugin is disabled, return the config without modifying it
    // The order of this check is important, we still want any webpack extensions to be applied even if the plugin is disabled
    if (pluginOptions.enabled === false) {
      return config
    }

    config.collections = [
      ...(config.collections || []).map(col => {
        const collection = { ...col }

        const { slug } = collection

        const isUserCollection = pluginOptions.userCollections.includes(slug)

        if (isUserCollection) {
          /**
           * Update users collection to manage their sessions
           */
          collection.fields = [...collection.fields, OAuthGroup(pluginOptions)]

          const endpointConfig: OperationConfig = {
            ...pluginOptions,
            endpointCollection: collection,
          }

          /**
           * Add OAuth endpoints to the users collection
           */
          collection.endpoints = [
            ...(collection.endpoints || []),
            ...oAuthEndpoints(endpointConfig),
          ]

          /**
           * Add OAuth hooks to the users collection
           */
          collection.hooks = {
            beforeOperation: [
              ...(collection.hooks?.beforeOperation || []),
              beforeRefreshOperationHook(endpointConfig),
              beforeLoginOperationHook(endpointConfig),
            ],
          }
        }

        return collection
      }),
      OAuthApps,
    ]

    config.express = {
      ...(config.express || {}),
      // Add additional express config here
      preMiddleware: [...(config.express?.preMiddleware || []), oAuthCsrf],
      postMiddleware: [...(config.express?.postMiddleware || []), oAuthCorsHeaders],
    }

    config.onInit = async payload => {
      if (incomingConfig.onInit) await incomingConfig.onInit(payload)
      // Add additional onInit code by using the onInitExtension function
      onInitExtension(pluginOptions, payload)
    }

    return config
  }
