import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      perfil: string
    } & DefaultSession['user']
  }
}
