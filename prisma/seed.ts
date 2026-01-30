import { PrismaClient, Role, DiscountType, OrderStatus, PaymentStatus, PaymentMethod, ShippingCarrier, ShippingStatus, MovementType } from '../src/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...\n');

  // Clean database in correct order (respect foreign keys)
  console.log('🧹 Cleaning database...');
  await prisma.wishlistItem.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.review.deleteMany();
  await prisma.stockAlert.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.variantAttributeValue.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productAttributeValue.deleteMany();
  await prisma.productAttribute.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database cleaned\n');

  // ==================== USERS ====================
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@tienda.pe',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      phone: '+51999999999',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const customers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'juan.perez@gmail.com',
        password: hashedPassword,
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '+51912345678',
        role: Role.USER,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria.garcia@gmail.com',
        password: hashedPassword,
        firstName: 'María',
        lastName: 'García',
        phone: '+51987654321',
        role: Role.USER,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'carlos.rodriguez@gmail.com',
        password: hashedPassword,
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        phone: '+51956789012',
        role: Role.USER,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${customers.length + 1} users\n`);

  // ==================== ADDRESSES ====================
  console.log('📍 Creating addresses...');
  const addresses = await Promise.all([
    prisma.address.create({
      data: {
        userId: customers[0].id,
        recipientName: 'Juan Pérez',
        phone: '+51912345678',
        street: 'Av. Javier Prado Este',
        number: '1234',
        apartment: 'Dpto 501',
        district: 'San Isidro',
        city: 'Lima',
        department: 'Lima',
        postalCode: '15036',
        reference: 'Frente al parque',
        isDefault: true,
      },
    }),
    prisma.address.create({
      data: {
        userId: customers[0].id,
        recipientName: 'Juan Pérez (Oficina)',
        phone: '+51912345678',
        street: 'Calle Las Begonias',
        number: '500',
        district: 'San Isidro',
        city: 'Lima',
        department: 'Lima',
        postalCode: '15046',
        reference: 'Centro Empresarial',
        isDefault: false,
      },
    }),
    prisma.address.create({
      data: {
        userId: customers[1].id,
        recipientName: 'María García',
        phone: '+51987654321',
        street: 'Av. Arequipa',
        number: '2500',
        district: 'Miraflores',
        city: 'Lima',
        department: 'Lima',
        postalCode: '15074',
        isDefault: true,
      },
    }),
    prisma.address.create({
      data: {
        userId: customers[2].id,
        recipientName: 'Carlos Rodríguez',
        phone: '+51956789012',
        street: 'Av. El Sol',
        number: '800',
        district: 'Cusco',
        city: 'Cusco',
        department: 'Cusco',
        postalCode: '08000',
        reference: 'A 2 cuadras de la Plaza de Armas',
        isDefault: true,
      },
    }),
  ]);
  console.log(`✅ Created ${addresses.length} addresses\n`);

  // ==================== CATEGORIES ====================
  console.log('📂 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Electrónica',
        slug: 'electronica',
        description: 'Productos electrónicos y gadgets',
        isActive: true,
        displayOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Ropa',
        slug: 'ropa',
        description: 'Moda y vestimenta',
        isActive: true,
        displayOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Hogar',
        slug: 'hogar',
        description: 'Artículos para el hogar',
        isActive: true,
        displayOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Deportes',
        slug: 'deportes',
        description: 'Artículos deportivos y fitness',
        isActive: true,
        displayOrder: 4,
      },
    }),
  ]);

  // Create subcategories
  const subcategories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Teléfonos inteligentes',
        parentId: categories[0].id,
        isActive: true,
        displayOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Laptops',
        slug: 'laptops',
        description: 'Computadoras portátiles',
        parentId: categories[0].id,
        isActive: true,
        displayOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Polos',
        slug: 'polos',
        description: 'Polos y camisetas',
        parentId: categories[1].id,
        isActive: true,
        displayOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Pantalones',
        slug: 'pantalones',
        description: 'Pantalones y jeans',
        parentId: categories[1].id,
        isActive: true,
        displayOrder: 2,
      },
    }),
  ]);
  console.log(`✅ Created ${categories.length + subcategories.length} categories\n`);

  // ==================== PRODUCT ATTRIBUTES ====================
  console.log('🏷️ Creating product attributes...');
  const colorAttribute = await prisma.productAttribute.create({
    data: { name: 'Color' },
  });
  const sizeAttribute = await prisma.productAttribute.create({
    data: { name: 'Talla' },
  });
  const storageAttribute = await prisma.productAttribute.create({
    data: { name: 'Almacenamiento' },
  });

  const colorValues = await Promise.all([
    prisma.productAttributeValue.create({ data: { attributeId: colorAttribute.id, value: 'Negro' } }),
    prisma.productAttributeValue.create({ data: { attributeId: colorAttribute.id, value: 'Blanco' } }),
    prisma.productAttributeValue.create({ data: { attributeId: colorAttribute.id, value: 'Azul' } }),
    prisma.productAttributeValue.create({ data: { attributeId: colorAttribute.id, value: 'Rojo' } }),
  ]);

  const sizeValues = await Promise.all([
    prisma.productAttributeValue.create({ data: { attributeId: sizeAttribute.id, value: 'S' } }),
    prisma.productAttributeValue.create({ data: { attributeId: sizeAttribute.id, value: 'M' } }),
    prisma.productAttributeValue.create({ data: { attributeId: sizeAttribute.id, value: 'L' } }),
    prisma.productAttributeValue.create({ data: { attributeId: sizeAttribute.id, value: 'XL' } }),
  ]);

  const storageValues = await Promise.all([
    prisma.productAttributeValue.create({ data: { attributeId: storageAttribute.id, value: '128GB' } }),
    prisma.productAttributeValue.create({ data: { attributeId: storageAttribute.id, value: '256GB' } }),
    prisma.productAttributeValue.create({ data: { attributeId: storageAttribute.id, value: '512GB' } }),
  ]);
  console.log(`✅ Created 3 attributes with ${colorValues.length + sizeValues.length + storageValues.length} values\n`);

  // ==================== PRODUCTS ====================
  console.log('📦 Creating products...');
  
  // Product 1: iPhone (with variants)
  const iphone = await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      description: 'El iPhone más avanzado con chip A17 Pro, cámara de 48MP y titanio de grado aeroespacial.',
      shortDescription: 'iPhone 15 Pro con chip A17 Pro',
      price: 4999.00,
      compareAtPrice: 5499.00,
      stock: 0,
      isActive: true,
      hasVariants: true,
      categoryId: subcategories[0].id,
    },
  });

  // iPhone variants
  const iphoneVariants = await Promise.all([
    prisma.productVariant.create({
      data: {
        productId: iphone.id,
        sku: 'IPHONE15PRO-128-NE',
        price: 4999.00,
        stock: 15,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: iphone.id,
        sku: 'IPHONE15PRO-256-NE',
        price: 5499.00,
        stock: 10,
        isActive: true,
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: iphone.id,
        sku: 'IPHONE15PRO-128-BL',
        price: 4999.00,
        stock: 8,
        isActive: true,
      },
    }),
  ]);

  // Link variant attributes
  await Promise.all([
    // Variant 1: Negro 128GB
    prisma.variantAttributeValue.create({
      data: { variantId: iphoneVariants[0].id, attributeValueId: colorValues[0].id },
    }),
    prisma.variantAttributeValue.create({
      data: { variantId: iphoneVariants[0].id, attributeValueId: storageValues[0].id },
    }),
    // Variant 2: Negro 256GB
    prisma.variantAttributeValue.create({
      data: { variantId: iphoneVariants[1].id, attributeValueId: colorValues[0].id },
    }),
    prisma.variantAttributeValue.create({
      data: { variantId: iphoneVariants[1].id, attributeValueId: storageValues[1].id },
    }),
    // Variant 3: Blanco 128GB
    prisma.variantAttributeValue.create({
      data: { variantId: iphoneVariants[2].id, attributeValueId: colorValues[1].id },
    }),
    prisma.variantAttributeValue.create({
      data: { variantId: iphoneVariants[2].id, attributeValueId: storageValues[0].id },
    }),
  ]);

  // Product 2: Polo (with variants)
  const polo = await prisma.product.create({
    data: {
      name: 'Polo Premium Algodón Pima',
      slug: 'polo-premium-algodon-pima',
      description: 'Polo de algodón pima peruano, el más suave del mundo. Fabricado en Perú con materiales de primera calidad.',
      shortDescription: 'Polo 100% algodón pima peruano',
      price: 89.90,
      compareAtPrice: 119.90,
      stock: 0,
      isActive: true,
      hasVariants: true,
      categoryId: subcategories[2].id,
    },
  });

  // Polo variants
  const poloVariants = await Promise.all([
    prisma.productVariant.create({
      data: { productId: polo.id, sku: 'POLO-PIMA-NE-M', price: 89.90, stock: 25, isActive: true },
    }),
    prisma.productVariant.create({
      data: { productId: polo.id, sku: 'POLO-PIMA-NE-L', price: 89.90, stock: 20, isActive: true },
    }),
    prisma.productVariant.create({
      data: { productId: polo.id, sku: 'POLO-PIMA-BL-M', price: 89.90, stock: 30, isActive: true },
    }),
    prisma.productVariant.create({
      data: { productId: polo.id, sku: 'POLO-PIMA-AZ-L', price: 89.90, stock: 15, isActive: true },
    }),
  ]);

  await Promise.all([
    prisma.variantAttributeValue.create({ data: { variantId: poloVariants[0].id, attributeValueId: colorValues[0].id } }),
    prisma.variantAttributeValue.create({ data: { variantId: poloVariants[0].id, attributeValueId: sizeValues[1].id } }),
    prisma.variantAttributeValue.create({ data: { variantId: poloVariants[1].id, attributeValueId: colorValues[0].id } }),
    prisma.variantAttributeValue.create({ data: { variantId: poloVariants[1].id, attributeValueId: sizeValues[2].id } }),
    prisma.variantAttributeValue.create({ data: { variantId: poloVariants[2].id, attributeValueId: colorValues[1].id } }),
    prisma.variantAttributeValue.create({ data: { variantId: poloVariants[2].id, attributeValueId: sizeValues[1].id } }),
    prisma.variantAttributeValue.create({ data: { variantId: poloVariants[3].id, attributeValueId: colorValues[2].id } }),
    prisma.variantAttributeValue.create({ data: { variantId: poloVariants[3].id, attributeValueId: sizeValues[2].id } }),
  ]);

  // Product 3: Simple product (no variants)
  const laptop = await prisma.product.create({
    data: {
      name: 'MacBook Air M3',
      slug: 'macbook-air-m3',
      description: 'El MacBook Air más potente con el chip M3. Pantalla Liquid Retina de 13.6 pulgadas.',
      shortDescription: 'MacBook Air con chip M3',
      price: 5999.00,
      compareAtPrice: 6499.00,
      stock: 12,
      isActive: true,
      hasVariants: false,
      categoryId: subcategories[1].id,
    },
  });

  // Product 4: Simple product
  const mancuernas = await prisma.product.create({
    data: {
      name: 'Set Mancuernas Ajustables 20kg',
      slug: 'set-mancuernas-ajustables-20kg',
      description: 'Set de mancuernas ajustables de 2kg a 20kg. Ideal para entrenamiento en casa.',
      shortDescription: 'Mancuernas ajustables hasta 20kg',
      price: 349.00,
      stock: 50,
      isActive: true,
      hasVariants: false,
      categoryId: categories[3].id,
    },
  });

  // Product 5: Simple product (low stock)
  const cafetera = await prisma.product.create({
    data: {
      name: 'Cafetera Express Italiana',
      slug: 'cafetera-express-italiana',
      description: 'Cafetera express de acero inoxidable. Capacidad para 6 tazas.',
      shortDescription: 'Cafetera italiana 6 tazas',
      price: 159.00,
      compareAtPrice: 199.00,
      stock: 5,
      isActive: true,
      hasVariants: false,
      categoryId: categories[2].id,
    },
  });
  console.log(`✅ Created 5 products with variants\n`);

  // ==================== PRODUCT IMAGES ====================
  console.log('🖼️ Creating product images...');
  await Promise.all([
    prisma.productImage.create({
      data: {
        productId: iphone.id,
        url: 'https://res.cloudinary.com/demo/image/upload/v1/products/iphone15pro-1.jpg',
        publicId: 'products/iphone15pro-1',
        alt: 'iPhone 15 Pro - Vista frontal',
        width: 1200,
        height: 1200,
        displayOrder: 1,
      },
    }),
    prisma.productImage.create({
      data: {
        productId: iphone.id,
        url: 'https://res.cloudinary.com/demo/image/upload/v1/products/iphone15pro-2.jpg',
        publicId: 'products/iphone15pro-2',
        alt: 'iPhone 15 Pro - Vista trasera',
        width: 1200,
        height: 1200,
        displayOrder: 2,
      },
    }),
    prisma.productImage.create({
      data: {
        productId: polo.id,
        url: 'https://res.cloudinary.com/demo/image/upload/v1/products/polo-pima-1.jpg',
        publicId: 'products/polo-pima-1',
        alt: 'Polo Algodón Pima',
        width: 800,
        height: 1000,
        displayOrder: 1,
      },
    }),
    prisma.productImage.create({
      data: {
        productId: laptop.id,
        url: 'https://res.cloudinary.com/demo/image/upload/v1/products/macbook-air-m3.jpg',
        publicId: 'products/macbook-air-m3',
        alt: 'MacBook Air M3',
        width: 1200,
        height: 800,
        displayOrder: 1,
      },
    }),
  ]);
  console.log(`✅ Created product images\n`);

  // ==================== STOCK ALERTS ====================
  console.log('🔔 Creating stock alerts...');
  await Promise.all([
    prisma.stockAlert.create({
      data: {
        productId: cafetera.id,
        lowStockThreshold: 10,
        criticalStockThreshold: 3,
        alertEnabled: true,
      },
    }),
    prisma.stockAlert.create({
      data: {
        productId: laptop.id,
        lowStockThreshold: 5,
        criticalStockThreshold: 2,
        alertEnabled: true,
      },
    }),
    prisma.stockAlert.create({
      data: {
        variantId: iphoneVariants[2].id,
        lowStockThreshold: 5,
        criticalStockThreshold: 2,
        alertEnabled: true,
      },
    }),
  ]);
  console.log(`✅ Created stock alerts\n`);

  // ==================== COUPONS ====================
  console.log('🎟️ Creating coupons...');
  const coupons = await Promise.all([
    prisma.coupon.create({
      data: {
        code: 'BIENVENIDO10',
        description: '10% de descuento para nuevos clientes',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        minPurchaseAmount: 100,
        maxDiscountAmount: 50,
        usageLimit: 1000,
        usageLimitPerUser: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        isActive: true,
        isFirstPurchaseOnly: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'VERANO2025',
        description: 'Descuento de verano S/30',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 30,
        minPurchaseAmount: 200,
        usageLimit: 500,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'ENVIOGRATIS',
        description: 'Envío gratis en compras mayores a S/150',
        discountType: DiscountType.FREE_SHIPPING,
        discountValue: 0,
        minPurchaseAmount: 150,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'TECH20',
        description: '20% descuento en electrónica',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        maxDiscountAmount: 200,
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        isActive: true,
        applicableCategories: [categories[0].id],
      },
    }),
  ]);
  console.log(`✅ Created ${coupons.length} coupons\n`);

  // ==================== CARTS ====================
  console.log('🛒 Creating carts...');
  const cart = await prisma.cart.create({
    data: {
      userId: customers[0].id,
      items: {
        create: [
          {
            productId: polo.id,
            variantId: poloVariants[0].id,
            quantity: 2,
          },
          {
            productId: mancuernas.id,
            quantity: 1,
          },
        ],
      },
    },
  });

  const guestCart = await prisma.cart.create({
    data: {
      sessionId: 'guest-session-abc123',
      items: {
        create: [
          {
            productId: cafetera.id,
            quantity: 1,
          },
        ],
      },
    },
  });
  console.log(`✅ Created carts\n`);

  // ==================== ORDERS ====================
  console.log('📋 Creating orders...');
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-0001',
      userId: customers[0].id,
      status: OrderStatus.DELIVERED,
      shippingAddress: {
        recipientName: 'Juan Pérez',
        phone: '+51912345678',
        street: 'Av. Javier Prado Este',
        number: '1234',
        apartment: 'Dpto 501',
        district: 'San Isidro',
        city: 'Lima',
        department: 'Lima',
        postalCode: '15036',
      },
      subtotal: 5088.90,
      shippingCost: 15.00,
      discount: 0,
      total: 5103.90,
      deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  });

  await Promise.all([
    prisma.orderItem.create({
      data: {
        orderId: order1.id,
        productId: iphone.id,
        variantId: iphoneVariants[0].id,
        productName: 'iPhone 15 Pro',
        variantAttributes: { Color: 'Negro', Almacenamiento: '128GB' },
        quantity: 1,
        unitPrice: 4999.00,
        subtotal: 4999.00,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: order1.id,
        productId: polo.id,
        variantId: poloVariants[0].id,
        productName: 'Polo Premium Algodón Pima',
        variantAttributes: { Color: 'Negro', Talla: 'M' },
        quantity: 1,
        unitPrice: 89.90,
        subtotal: 89.90,
      },
    }),
  ]);

  // Payment for order 1
  await prisma.payment.create({
    data: {
      orderId: order1.id,
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.COMPLETED,
      amount: 5103.90,
      currency: 'PEN',
      externalId: 'pi_test_123456789',
      externalStatus: 'succeeded',
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Shipment for order 1
  const shipment1 = await prisma.shipment.create({
    data: {
      orderId: order1.id,
      carrier: ShippingCarrier.OLVA,
      status: ShippingStatus.DELIVERED,
      trackingNumber: 'OLVA-PE-123456',
      trackingUrl: 'https://tracking.olvacourier.com/OLVA-PE-123456',
      recipientName: 'Juan Pérez',
      recipientPhone: '+51912345678',
      addressLine1: 'Av. Javier Prado Este 1234, Dpto 501',
      city: 'Lima',
      department: 'Lima',
      postalCode: '15036',
      shippingCost: 15.00,
      weightKg: 0.5,
      shippedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.shipmentEvent.createMany({
    data: [
      {
        shipmentId: shipment1.id,
        status: ShippingStatus.PROCESSING,
        location: 'Lima - Centro de distribución',
        description: 'Paquete recibido en centro de distribución',
        occurredAt: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000),
      },
      {
        shipmentId: shipment1.id,
        status: ShippingStatus.SHIPPED,
        location: 'Lima',
        description: 'Paquete en camino',
        occurredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        shipmentId: shipment1.id,
        status: ShippingStatus.DELIVERED,
        location: 'San Isidro, Lima',
        description: 'Entregado - Recibido por: Juan Pérez',
        occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Order 2: Processing
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-0002',
      userId: customers[1].id,
      status: OrderStatus.PROCESSING,
      shippingAddress: {
        recipientName: 'María García',
        phone: '+51987654321',
        street: 'Av. Arequipa',
        number: '2500',
        district: 'Miraflores',
        city: 'Lima',
        department: 'Lima',
      },
      subtotal: 6348.00,
      shippingCost: 0,
      discount: 30.00,
      discountCode: 'VERANO2025',
      total: 6318.00,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      productId: laptop.id,
      productName: 'MacBook Air M3',
      quantity: 1,
      unitPrice: 5999.00,
      subtotal: 5999.00,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      productId: mancuernas.id,
      productName: 'Set Mancuernas Ajustables 20kg',
      quantity: 1,
      unitPrice: 349.00,
      subtotal: 349.00,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order2.id,
      method: PaymentMethod.MERCADOPAGO,
      status: PaymentStatus.COMPLETED,
      amount: 6318.00,
      currency: 'PEN',
      externalId: 'mp_payment_987654321',
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Coupon usage
  await prisma.couponUsage.create({
    data: {
      couponId: coupons[1].id,
      userId: customers[1].id,
      orderId: order2.id,
      discountApplied: 30.00,
    },
  });

  // Order 3: Pending
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-2025-0003',
      userId: customers[2].id,
      status: OrderStatus.PENDING,
      shippingAddress: {
        recipientName: 'Carlos Rodríguez',
        phone: '+51956789012',
        street: 'Av. El Sol',
        number: '800',
        district: 'Cusco',
        city: 'Cusco',
        department: 'Cusco',
        reference: 'A 2 cuadras de la Plaza de Armas',
      },
      subtotal: 159.00,
      shippingCost: 25.00,
      discount: 0,
      total: 184.00,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order3.id,
      productId: cafetera.id,
      productName: 'Cafetera Express Italiana',
      quantity: 1,
      unitPrice: 159.00,
      subtotal: 159.00,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order3.id,
      method: PaymentMethod.CASH_ON_DELIVERY,
      status: PaymentStatus.PENDING,
      amount: 184.00,
      currency: 'PEN',
    },
  });
  console.log(`✅ Created orders with payments and shipments\n`);

  // ==================== INVENTORY MOVEMENTS ====================
  console.log('📊 Creating inventory movements...');
  await prisma.inventoryMovement.createMany({
    data: [
      {
        productId: iphone.id,
        variantId: iphoneVariants[0].id,
        type: MovementType.PURCHASE,
        quantity: 20,
        previousStock: 0,
        newStock: 20,
        referenceNumber: 'PO-2025-001',
        notes: 'Compra inicial de inventario',
        performedBy: adminUser.id,
        unitCost: 3500.00,
      },
      {
        productId: iphone.id,
        variantId: iphoneVariants[0].id,
        type: MovementType.SALE,
        quantity: -1,
        previousStock: 20,
        newStock: 19,
        orderId: order1.id,
        notes: 'Venta orden ORD-2025-0001',
      },
      {
        productId: polo.id,
        variantId: poloVariants[0].id,
        type: MovementType.PURCHASE,
        quantity: 50,
        previousStock: 0,
        newStock: 50,
        referenceNumber: 'PO-2025-002',
        performedBy: adminUser.id,
        unitCost: 35.00,
      },
      {
        productId: laptop.id,
        type: MovementType.PURCHASE,
        quantity: 15,
        previousStock: 0,
        newStock: 15,
        referenceNumber: 'PO-2025-003',
        performedBy: adminUser.id,
        unitCost: 4200.00,
      },
      {
        productId: laptop.id,
        type: MovementType.RESERVATION,
        quantity: -1,
        previousStock: 15,
        newStock: 14,
        orderId: order2.id,
        notes: 'Reserva para orden ORD-2025-0002',
      },
      {
        productId: cafetera.id,
        type: MovementType.DAMAGED,
        quantity: -2,
        previousStock: 7,
        newStock: 5,
        notes: 'Productos dañados en transporte',
        performedBy: adminUser.id,
      },
    ],
  });
  console.log(`✅ Created inventory movements\n`);

  // ==================== REVIEWS ====================
  console.log('⭐ Creating reviews...');
  await Promise.all([
    prisma.review.create({
      data: {
        userId: customers[0].id,
        productId: iphone.id,
        rating: 5,
        title: '¡Excelente teléfono!',
        comment: 'Increíble calidad de cámara y rendimiento. El envío fue muy rápido. Totalmente recomendado.',
        isVerifiedPurchase: true,
        isApproved: true,
        helpfulCount: 12,
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[0].id,
        productId: polo.id,
        rating: 5,
        title: 'El mejor polo que he comprado',
        comment: 'La calidad del algodón pima es incomparable. Muy suave y cómodo.',
        isVerifiedPurchase: true,
        isApproved: true,
        helpfulCount: 8,
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[1].id,
        productId: laptop.id,
        rating: 4,
        title: 'Muy buena laptop',
        comment: 'Excelente rendimiento para trabajo. El único punto en contra es que podría tener más puertos USB.',
        isVerifiedPurchase: true,
        isApproved: true,
        helpfulCount: 5,
        adminResponse: '¡Gracias por tu feedback! Te recomendamos el hub USB-C que tenemos disponible.',
        adminResponseAt: new Date(),
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[2].id,
        productId: mancuernas.id,
        rating: 5,
        title: 'Perfectas para casa',
        comment: 'Excelente relación calidad-precio. El ajuste de peso es muy fácil.',
        isVerifiedPurchase: false,
        isApproved: true,
        helpfulCount: 3,
      },
    }),
  ]);
  console.log(`✅ Created reviews\n`);

  // ==================== WISHLIST ====================
  console.log('💝 Creating wishlist items...');
  await Promise.all([
    prisma.wishlistItem.create({
      data: {
        userId: customers[0].id,
        productId: laptop.id,
        priceWhenAdded: 5999.00,
        notifyOnPriceDrop: true,
        notifyOnBackInStock: false,
        notes: 'Para el próximo año',
      },
    }),
    prisma.wishlistItem.create({
      data: {
        userId: customers[1].id,
        productId: iphone.id,
        variantId: iphoneVariants[1].id,
        priceWhenAdded: 5499.00,
        notifyOnPriceDrop: true,
        notifyOnBackInStock: false,
      },
    }),
    prisma.wishlistItem.create({
      data: {
        userId: customers[2].id,
        productId: polo.id,
        variantId: poloVariants[3].id,
        priceWhenAdded: 89.90,
        notifyOnBackInStock: true,
      },
    }),
  ]);
  console.log(`✅ Created wishlist items\n`);

  // ==================== SUMMARY ====================
  console.log('═'.repeat(50));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('═'.repeat(50));
  console.log('\n📊 Database Summary:');
  console.log(`   👥 Users: ${await prisma.user.count()}`);
  console.log(`   📍 Addresses: ${await prisma.address.count()}`);
  console.log(`   📂 Categories: ${await prisma.category.count()}`);
  console.log(`   📦 Products: ${await prisma.product.count()}`);
  console.log(`   🔄 Product Variants: ${await prisma.productVariant.count()}`);
  console.log(`   🖼️  Product Images: ${await prisma.productImage.count()}`);
  console.log(`   🛒 Carts: ${await prisma.cart.count()}`);
  console.log(`   📋 Orders: ${await prisma.order.count()}`);
  console.log(`   💳 Payments: ${await prisma.payment.count()}`);
  console.log(`   🚚 Shipments: ${await prisma.shipment.count()}`);
  console.log(`   📊 Inventory Movements: ${await prisma.inventoryMovement.count()}`);
  console.log(`   🔔 Stock Alerts: ${await prisma.stockAlert.count()}`);
  console.log(`   ⭐ Reviews: ${await prisma.review.count()}`);
  console.log(`   🎟️  Coupons: ${await prisma.coupon.count()}`);
  console.log(`   💝 Wishlist Items: ${await prisma.wishlistItem.count()}`);
  console.log('\n📧 Test Users:');
  console.log('   Admin: admin@tienda.pe / password123');
  console.log('   User 1: juan.perez@gmail.com / password123');
  console.log('   User 2: maria.garcia@gmail.com / password123');
  console.log('   User 3: carlos.rodriguez@gmail.com / password123');
  console.log('\n🎟️  Test Coupons: BIENVENIDO10, VERANO2025, ENVIOGRATIS, TECH20');
  console.log('═'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
