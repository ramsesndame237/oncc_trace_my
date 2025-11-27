import Actor from '#models/actor'
import Location from '#models/location'
import ProductionBasin from '#models/production_basin'
import ProductionBasinService from '#services/production_basin_service'
import { ProductionBasinErrorCodes } from '#types/errors/production_basin'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Production Basins Model', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should create a production basin', async ({ assert }) => {
    const basin = await ProductionBasin.create({
      name: 'Test Basin',
      description: 'Test description',
    })

    assert.exists(basin.id)
    assert.equal(basin.name, 'Test Basin')
    assert.equal(basin.description, 'Test description')
    assert.exists(basin.createdAt)
    assert.exists(basin.updatedAt)
  })

  test('should require unique basin names', async ({ assert }) => {
    await ProductionBasin.create({
      name: 'Unique Basin',
      description: 'First basin',
    })

    try {
      await ProductionBasin.create({
        name: 'Unique Basin',
        description: 'Second basin',
      })
      assert.fail('Should have thrown an error for duplicate name')
    } catch (error) {
      assert.exists(error)
    }
  })

  test('should allow null description', async ({ assert }) => {
    const basin = await ProductionBasin.create({
      name: 'Basin Without Description',
    })

    assert.exists(basin.id)
    assert.equal(basin.name, 'Basin Without Description')
    assert.isNull(basin.description)
  })

  test('should have locations relation', async ({ assert }) => {
    const basin = await ProductionBasin.create({
      name: 'Basin With Locations',
      description: 'Test locations relation',
    })

    await basin.load('locations')
    assert.isArray(basin.locations)
  })

  test('should have users relation', async ({ assert }) => {
    const basin = await ProductionBasin.create({
      name: 'Basin With Users',
      description: 'Test users relation',
    })

    await basin.load('users')
    assert.isArray(basin.users)
  })

  test('should be able to associate with producers via locations', async ({ assert }) => {
    // Créer un bassin
    const basin = await ProductionBasin.create({
      name: 'Bassin Test Producteurs',
      description: 'Bassin pour test relation producteurs',
    })

    // Créer une localisation et l'associer au bassin
    const location = await Location.create({
      code: 'TEST-LOC-001',
      name: 'Test Location',
      type: 'village',
    })

    await basin.related('locations').attach([location.code])

    // Créer un producteur dans cette localisation
    const producer = await Actor.create({
      actorType: 'PRODUCER',
      familyName: 'Producteur Test',
      locationCode: location.code,
      status: 'active',
    })

    // Vérifier que le producteur est bien créé
    assert.exists(producer.id)
    assert.equal(producer.actorType, 'PRODUCER')
    assert.equal(producer.locationCode, location.code)

    // Vérifier que le bassin a des locations
    await basin.load('locations')
    assert.isArray(basin.locations)
    assert.lengthOf(basin.locations, 1)
    assert.equal(basin.locations[0].code, location.code)
  })
})

test.group('Production Basins Service - Location Conflicts Validation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  let productionBasinService: ProductionBasinService
  let location1: Location
  let location2: Location
  let location3: Location
  let existingBasin: ProductionBasin

  group.each.setup(async () => {
    productionBasinService = new ProductionBasinService()

    // Créer d'abord une région parent pour respecter la hiérarchie
    const parentRegion = await Location.create({
      code: 'TEST-REG',
      name: 'Test Region',
      type: 'region',
    })

    // Créer des localisations de test avec parentCode
    location1 = await Location.create({
      code: 'TEST-001',
      name: 'Location Test 1',
      type: 'department',
      parentCode: parentRegion.code,
    })

    location2 = await Location.create({
      code: 'TEST-002',
      name: 'Location Test 2',
      type: 'department',
      parentCode: parentRegion.code,
    })

    location3 = await Location.create({
      code: 'TEST-003',
      name: 'Location Test 3',
      type: 'department',
      parentCode: parentRegion.code,
    })

    // Créer un bassin existant avec des localisations
    existingBasin = await ProductionBasin.create({
      name: 'Bassin Existant',
      description: 'Bassin avec localisations déjà assignées',
    })

    await existingBasin.related('locations').attach([location1.code, location2.code])
  })

  test('should create basin without conflicts when no location codes provided', async ({
    assert,
  }) => {
    const basin = await productionBasinService.create({
      name: 'Nouveau Bassin Sans Locations',
      description: 'Test création sans localisations',
    })

    assert.exists(basin.id)
    assert.equal(basin.name, 'Nouveau Bassin Sans Locations')
  })

  test('should create basin without conflicts when using unassigned locations', async ({
    assert,
  }) => {
    const basin = await productionBasinService.create({
      name: 'Nouveau Bassin',
      description: 'Test création avec locations libres',
      locationCodes: [location3.code],
    })

    assert.exists(basin.id)
    assert.equal(basin.name, 'Nouveau Bassin')

    await basin.load('locations')
    assert.lengthOf(basin.locations, 1)
    assert.equal(basin.locations[0].code, location3.code)
  })

  test('should reject creation when location conflicts exist', async ({ assert }) => {
    try {
      await productionBasinService.create({
        name: 'Bassin Conflit',
        description: 'Test création avec conflit',
        locationCodes: [location1.code], // Déjà assignée au bassin existant
      })
      assert.fail('Should have thrown a location conflict error')
    } catch (error) {
      assert.equal(error.code, ProductionBasinErrorCodes.LOCATION_CONFLICTS)
      assert.include(error.message, 'Certaines localisations sont déjà associées')
      assert.include(error.message, location1.name)
      assert.include(error.message, existingBasin.name)
      assert.exists(error.conflicts)
      assert.isArray(error.conflicts)
      assert.lengthOf(error.conflicts, 1)
    }
  })

  test('should reject creation with multiple location conflicts', async ({ assert }) => {
    try {
      await productionBasinService.create({
        name: 'Bassin Conflits Multiples',
        description: 'Test avec plusieurs conflits',
        locationCodes: [location1.code, location2.code], // Toutes deux assignées
      })
      assert.fail('Should have thrown a location conflict error')
    } catch (error) {
      assert.equal(error.code, ProductionBasinErrorCodes.LOCATION_CONFLICTS)
      assert.exists(error.conflicts)
      assert.lengthOf(error.conflicts, 2)
    }
  })

  test('should allow updating basin with its own locations', async ({ assert }) => {
    const updatedBasin = await productionBasinService.update(existingBasin.id, {
      name: 'Bassin Mis à Jour',
      locationCodes: [location1.code, location2.code], // Ses propres locations
    })

    assert.equal(updatedBasin.name, 'Bassin Mis à Jour')
    await updatedBasin.load('locations')
    assert.lengthOf(updatedBasin.locations, 2)
  })

  test('should reject update when adding conflicting locations', async ({ assert }) => {
    // Créer un second bassin avec location3
    const secondBasin = await productionBasinService.create({
      name: 'Second Bassin',
      locationCodes: [location3.code],
    })

    try {
      await productionBasinService.update(existingBasin.id, {
        locationCodes: [location1.code, location3.code], // location3 appartient au second bassin
      })
      assert.fail('Should have thrown a location conflict error')
    } catch (error) {
      assert.equal(error.code, ProductionBasinErrorCodes.LOCATION_CONFLICTS)
      assert.include(error.message, location3.name)
      assert.include(error.message, secondBasin.name)
    }
  })

  test('should allow update with empty location codes array', async ({ assert }) => {
    const updatedBasin = await productionBasinService.update(existingBasin.id, {
      name: 'Bassin Sans Locations',
      locationCodes: [], // Retirer toutes les localisations
    })

    assert.equal(updatedBasin.name, 'Bassin Sans Locations')
    await updatedBasin.load('locations')
    assert.lengthOf(updatedBasin.locations, 0)
  })

  test('should handle mixed scenario: keep some, remove some, add new ones', async ({ assert }) => {
    const updatedBasin = await productionBasinService.update(existingBasin.id, {
      locationCodes: [location1.code, location3.code], // Garder location1, enlever location2, ajouter location3
    })

    await updatedBasin.load('locations')
    assert.lengthOf(updatedBasin.locations, 2)

    const locationCodes = updatedBasin.locations.map((loc) => loc.code)
    assert.include(locationCodes, location1.code)
    assert.include(locationCodes, location3.code)
    assert.notInclude(locationCodes, location2.code)
  })

  test('should handle conflicts error structure correctly', async ({ assert }) => {
    try {
      await productionBasinService.create({
        name: 'Test Structure Erreur',
        locationCodes: [location1.code, location2.code],
      })
      assert.fail('Should have thrown a location conflict error')
    } catch (error) {
      // Vérifier la structure de l'erreur
      assert.equal(error.code, ProductionBasinErrorCodes.LOCATION_CONFLICTS)
      assert.exists(error.conflicts)
      assert.isArray(error.conflicts)

      // Vérifier la structure de chaque conflit
      error.conflicts.forEach((conflict: any) => {
        assert.exists(conflict.locationCode)
        assert.exists(conflict.locationName)
        assert.exists(conflict.basinId)
        assert.exists(conflict.basinName)
        assert.isString(conflict.locationCode)
        assert.isString(conflict.locationName)
        assert.isString(conflict.basinId)
        assert.isString(conflict.basinName)
      })
    }
  })
})
