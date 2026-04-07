import { AsyncLocalStorage } from 'async_hooks'

export const requestContext = new AsyncLocalStorage<{ currentUser: any }>()