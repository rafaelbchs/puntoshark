export interface Product {
    id: string // This should be a UUID string
    name: string
    price: number
    image: string
    description?: string
    category?: string
  }
  
  export interface CartItem extends Product {
    quantity: number
  }
  