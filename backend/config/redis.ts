import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'

const redisConfig = defineConfig({
  connection: 'main',

  connections: {
    /*
    |--------------------------------------------------------------------------
    | Main connection
    |--------------------------------------------------------------------------
    |
    | The main connection is used by the "Redis.connection('main')" method.
    | You can rename this connection to something else and update the
    | "connection" property to reference the new connection name.
    |
    */
    main: {
      host: env.get('REDIS_HOST', 'redis'),
      port: env.get('REDIS_PORT', 6379),
      password: env.get('REDIS_PASSWORD', ''),
      db: env.get('REDIS_DB', 0),
      keyPrefix: env.get('REDIS_KEY_PREFIX', 'sifc:'),

      /*
      |--------------------------------------------------------------------------
      | Health check
      |--------------------------------------------------------------------------
      |
      | Health check is performed when the "redis.report()" method is called.
      |
      */
      healthCheck: true,

      /*
      |--------------------------------------------------------------------------
      | Retry strategy
      |--------------------------------------------------------------------------
      |
      | The retry strategy is used to retry failed commands. You can disable
      | retries by setting the "retryDelayOnFailover" to 0.
      |
      */
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,

      /*
      |--------------------------------------------------------------------------
      | Connection timeout
      |--------------------------------------------------------------------------
      |
      | Connection timeout in milliseconds. The connection will be closed if
      | it takes longer than the specified timeout to connect to Redis.
      |
      */
      connectTimeout: 10000,
      commandTimeout: 5000,
    },

    /*
    |--------------------------------------------------------------------------
    | Session connection
    |--------------------------------------------------------------------------
    |
    | Dedicated connection for session storage. This connection uses a different
    | database to separate session data from application data.
    |
    */
    session: {
      host: env.get('REDIS_HOST', '127.0.0.1'),
      port: env.get('REDIS_PORT', 6379),
      password: env.get('REDIS_PASSWORD', ''),
      db: env.get('REDIS_SESSION_DB', 1),
      keyPrefix: env.get('REDIS_KEY_PREFIX', 'sifc:') + 'session:',
      healthCheck: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    },

    /*
    |--------------------------------------------------------------------------
    | Cache connection
    |--------------------------------------------------------------------------
    |
    | Dedicated connection for caching. This connection uses a different
    | database to separate cache data from application data.
    |
    */
    cache: {
      host: env.get('REDIS_HOST', '127.0.0.1'),
      port: env.get('REDIS_PORT', 6379),
      password: env.get('REDIS_PASSWORD', ''),
      db: env.get('REDIS_CACHE_DB', 2),
      keyPrefix: env.get('REDIS_KEY_PREFIX', 'sifc:') + 'cache:',
      healthCheck: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    },
  },
})

export default redisConfig
