-- CreateTable	
CREATE TABLE "User" (	
    "id" TEXT NOT NULL,	
    "name" TEXT,	
    "email" TEXT NOT NULL,	
    "password" TEXT NOT NULL,	
    "role" TEXT NOT NULL DEFAULT 'customer',	
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,	
    "updatedAt" TIMESTAMP(3) NOT NULL,	

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")	
);	

-- CreateTable	
CREATE TABLE "Product" (	
    "id" TEXT NOT NULL,	
    "name" TEXT NOT NULL,	
    "description" TEXT NOT NULL,	
    "price" DOUBLE PRECISION NOT NULL,	
    "image" TEXT,	
    "inventory" INTEGER NOT NULL DEFAULT 0,	
    "visible" BOOLEAN NOT NULL DEFAULT true,	
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,	
    "updatedAt" TIMESTAMP(3) NOT NULL,	

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")	
);	

-- CreateTable	
CREATE TABLE "CartItem" (	
    "id" TEXT NOT NULL,	
    "userId" TEXT NOT NULL,	
    "productId" TEXT NOT NULL,	
    "quantity" INTEGER NOT NULL DEFAULT 1,	
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,	
    "updatedAt" TIMESTAMP(3) NOT NULL,	

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")	
);	

-- CreateTable	
CREATE TABLE "Order" (	
    "id" TEXT NOT NULL,	
    "userId" TEXT NOT NULL,	
    "status" TEXT NOT NULL DEFAULT 'pending',	
    "total" DOUBLE PRECISION NOT NULL,	
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,	
    "updatedAt" TIMESTAMP(3) NOT NULL,	

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")	
);	

-- CreateTable	
CREATE TABLE "OrderItem" (	
    "id" TEXT NOT NULL,	
    "orderId" TEXT NOT NULL,	
    "productId" TEXT NOT NULL,	
    "quantity" INTEGER NOT NULL,	
    "price" DOUBLE PRECISION NOT NULL,	
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,	
    "updatedAt" TIMESTAMP(3) NOT NULL,	

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")	
);	

-- CreateIndex	
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");	

-- AddForeignKey	
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;	

-- AddForeignKey	
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;	

-- AddForeignKey	
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;	

-- AddForeignKey	
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;	

-- AddForeignKey	
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;