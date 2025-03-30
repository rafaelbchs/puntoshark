"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { X, Trash2, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeItem, updateQuantity, subtotal } = useCart()
  const [isRemoving, setIsRemoving] = useState<string | null>(null)

  const shipping = subtotal > 0 ? 5.99 : 0
  const total = subtotal + shipping

  const handleRemoveItem = async (id: string) => {
    setIsRemoving(id)
    removeItem(id)
    setIsRemoving(null)
  }

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return
    updateQuantity(id, quantity)
  }

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />}

      {/* Cart drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Your Cart ({items.length})</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-black">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto py-4 px-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBagIcon className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
                <Button onClick={onClose}>Continue Shopping</Button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {items.map((item) => (
                  <li key={item.id} className="py-6">
                    <div className="flex items-center">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <Image
                          src={item.image || "/placeholder.svg?height=80&width=80"}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>

                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              <Link href={`/products/${item.id}`} onClick={onClose}>
                                {item.name}
                              </Link>
                            </h3>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-300 rounded-sm">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 text-gray-500 hover:text-black"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 text-sm font-medium text-gray-900">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 text-gray-500 hover:text-black"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-gray-500 hover:text-black"
                            disabled={isRemoving === item.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer with totals and checkout */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">Subtotal</p>
                  <p className="font-medium">${subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-gray-500">Shipping</p>
                  <p className="font-medium">${shipping.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-base font-medium pt-2 border-t border-gray-200">
                  <p>Total</p>
                  <p>${total.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/checkout" passHref>
                  <Button onClick={onClose} className="w-full bg-black hover:bg-gray-900 text-white py-3 rounded-none">
                    Checkout
                  </Button>
                </Link>
                <button onClick={onClose} className="mt-4 text-sm text-center w-full text-gray-500 hover:text-black">
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Shopping bag icon for empty cart
function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <path d="M16 10a4 4 0 0 1-8 0"></path>
    </svg>
  )
}

