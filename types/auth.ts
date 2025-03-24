export type AdminUser = {
    id: string
    username: string
    role: string
  }
  
  export type AuthResult = {
    success: boolean
    admin?: AdminUser
    error?: string
  }
  
  