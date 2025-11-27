import vine from '@vinejs/vine'

export const assignUsersValidator = vine.compile(
  vine.object({
    userIds: vine.array(
      vine.number().exists(async (db, value) => {
        const result = await db.from('users').where('id', value).first()
        return !!result
      })
    ),
  })
)
