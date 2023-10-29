import type { Server } from 'http'
import mongoose from 'mongoose'
import payload from 'payload'
import { start } from '../server'
import { TypeWithID } from 'payload/types'

describe('Plugin tests', () => {
  let server: Server
  let newCollection: (TypeWithID & Record<string, any>)[]

  beforeAll(async () => {
    server = await start({ local: true })
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    server.close()
  })

  // Add tests to ensure that the plugin works as expected

  // Example test to check for seeded data
  it('seeds data accordingly', async () => {
    const newCollectionQuery = await payload.find({
      collection: 'oAuthApps',
      sort: 'createdAt',
    })

    newCollection = newCollectionQuery.docs

    expect(newCollectionQuery.totalDocs).toEqual(1)
  })

  // Example test to check for seeded data
  it('seeds data with correct values', async () => {
    expect(newCollection[0].credentials.clientId).toEqual(
      'CI_8da98ef44d877f6e50abeab6cc665e01350d5281abc6a509d8253f9f2b88608e',
    )
  })
})
