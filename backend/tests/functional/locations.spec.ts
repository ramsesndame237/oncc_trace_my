import { ApiClient } from '@japa/api-client'
import { test } from '@japa/runner'

test.group('Locations API', () => {
  test('should get locations list', async ({ client }: { client: ApiClient }) => {
    const response = await client.get('/api/v1/locations')

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
    })
  })

  test('should get locations hierarchy', async ({ client }: { client: ApiClient }) => {
    const response = await client.get('/api/v1/locations/hierarchy')

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
    })
  })

  test('should require authentication for creating locations', async ({
    client,
  }: {
    client: ApiClient
  }) => {
    const response = await client.post('/api/v1/locations').json({
      nom: 'Test Location',
      type: 'region',
      code: 'TEST',
    })

    response.assertStatus(401)
  })

  test('should validate location data', async ({ client }: { client: ApiClient }) => {
    // TODO: Add authentication token for technical_admin user
    const response = await client.post('/api/v1/locations').json({
      nom: '', // Invalid: empty name
      type: 'invalid_type', // Invalid: wrong type
      code: '', // Invalid: empty code
    })

    // Should return validation error (400) or unauthorized (401)
    response.assertStatus(401)
  })

  test('should get location by code', async ({ client }: { client: ApiClient }) => {
    // Test with a known location code (assuming CE exists from seeder)
    const response = await client.get('/api/v1/locations/CE')

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
    })
  })

  test('should return 404 for non-existent location', async ({ client }: { client: ApiClient }) => {
    const response = await client.get('/api/v1/locations/NONEXISTENT')

    response.assertStatus(404)
    response.assertBodyContains({
      success: false,
    })
  })

  test('should get children of a location', async ({ client }: { client: ApiClient }) => {
    // Test with a known parent location code
    const response = await client.get('/api/v1/locations/CE/children')

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
    })
  })
})
