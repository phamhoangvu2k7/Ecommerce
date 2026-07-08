import { defineEventHandler, getRouterParam } from 'h3'
import { blob } from 'hub:blob'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')

  if (!pathname) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found',
    })
  }

  return blob.serve(event, pathname)
})
