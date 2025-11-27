import User from '#models/user'
import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class TestUserActor extends BaseCommand {
  static commandName = 'test:user-actor'
  static description = 'Test user actor relation'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const userId = '51b0bcaa-ff80-483f-8555-7f2089c60556'

    this.logger.info(`Testing user actor relation for user: ${userId}`)

    // Test 1: Load user with actor relation
    const user = await User.query().where('id', userId).preload('actor').first()

    if (!user) {
      this.logger.error('User not found')
      return
    }

    this.logger.info(`User found: ${user.username}`)
    this.logger.info(`Actor ID: ${user.actorId}`)
    this.logger.info(`Actor loaded: ${user.actor ? 'YES' : 'NO'}`)

    if (user.actor) {
      this.logger.info(`Actor details:`)
      this.logger.info(`  - ID: ${user.actor.id}`)
      this.logger.info(`  - Type: ${user.actor.actorType}`)
      this.logger.info(`  - Name: ${user.actor.familyName} ${user.actor.givenName}`)
    }

    // Test 2: Serialize with relations
    const serialized = user.serialize({
      fields: {
        omit: ['passwordHash', 'securityAnswer1Hash', 'securityAnswer2Hash', 'securityAnswer3Hash'],
      },
      relations: {
        actor: {
          fields: {
            pick: ['id', 'actorType', 'familyName', 'givenName'],
          },
        },
      },
    })

    this.logger.info('\nSerialized output:')
    console.log(JSON.stringify(serialized, null, 2))
  }
}
