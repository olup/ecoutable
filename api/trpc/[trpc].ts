import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { router } from '.'

export function onRequest(context: any) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: context.request,
    router,
    createContext: () => ({}),
  })
}
