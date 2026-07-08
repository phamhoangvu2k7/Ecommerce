import { defineEventHandler, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')

  if (!pathname) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found',
    })
  }

  return hubBlob().serve(event, pathname)
})
