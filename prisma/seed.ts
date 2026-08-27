import {
  DiscountType,
  MovementType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  Role,
  ShippingCarrier,
  ShippingStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
      emailVerified: true,
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
        isActive: false,
        emailVerified: true,
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
        isActive: false,
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
        isActive: false,
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
        label: 'Casa',
        recipientName: 'Juan Pérez',
        recipientPhone: '+51912345678',
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
        label: 'Oficina',
        recipientName: 'Juan Pérez (Oficina)',
        recipientPhone: '+51912345678',
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
        label: 'Casa',
        recipientName: 'María García',
        recipientPhone: '+51987654321',
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
        label: 'Casa',
        recipientName: 'Carlos Rodríguez',
        recipientPhone: '+51956789012',
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
    prisma.category.create({
      data: {
        name: 'Libros',
        slug: 'libros',
        description: 'Libros y literatura',
        isActive: true,
        displayOrder: 5,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Belleza',
        slug: 'belleza',
        description: 'Productos de belleza y cuidado personal',
        isActive: true,
        displayOrder: 6,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Jardín',
        slug: 'jardin',
        description: 'Artículos para jardín y exteriores',
        isActive: true,
        displayOrder: 7,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Cocina',
        slug: 'cocina',
        description: 'Utensilios y electrodomésticos de cocina',
        isActive: true,
        displayOrder: 8,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Juguetes',
        slug: 'juguetes',
        description: 'Juguetes y entretenimiento para niños',
        isActive: true,
        displayOrder: 9,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Automotriz',
        slug: 'automotriz',
        description: 'Accesorios y productos para automóviles',
        isActive: true,
        displayOrder: 10,
      },
    }),
  ]);
  console.log(`✅ Created ${categories.length} categories\n`);

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
  const materialAttribute = await prisma.productAttribute.create({
    data: { name: 'Material' },
  });
  const capacityAttribute = await prisma.productAttribute.create({
    data: { name: 'Capacidad' },
  });
  const flavorAttribute = await prisma.productAttribute.create({
    data: { name: 'Sabor' },
  });

  const colorValues = await Promise.all([
    prisma.productAttributeValue.create({
      data: { attributeId: colorAttribute.id, value: 'Negro' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: colorAttribute.id, value: 'Blanco' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: colorAttribute.id, value: 'Azul' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: colorAttribute.id, value: 'Rojo' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: colorAttribute.id, value: 'Verde' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: colorAttribute.id, value: 'Gris' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: colorAttribute.id, value: 'Marrón' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: colorAttribute.id, value: 'Beige' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: colorAttribute.id, value: 'Morado' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: colorAttribute.id, value: 'Terracota' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: colorAttribute.id, value: 'Rosa' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: colorAttribute.id, value: 'Plateado' },
    }),
  ]);

  const sizeValues = await Promise.all([
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: 'S' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: 'M' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: 'L' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: 'XL' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: 'XXL' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: '28' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: '30' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: '32' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: '34' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: '38' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: '40' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: '42' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: '44' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: '7' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: 'Queen' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: 'King' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: '16"' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: sizeAttribute.id, value: '17"' },
    }),
  ]);

  const storageValues = await Promise.all([
    prisma.productAttributeValue.create({
      data: { attributeId: storageAttribute.id, value: '128GB' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: storageAttribute.id, value: '256GB' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: storageAttribute.id, value: '512GB' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: storageAttribute.id, value: '1TB' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: storageAttribute.id, value: '8GB' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: storageAttribute.id, value: '16GB' },
    }),
  ]);

  const materialValues = await Promise.all([
    prisma.productAttributeValue.create({
      data: { attributeId: materialAttribute.id, value: 'Algodón' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: materialAttribute.id, value: 'Poliéster' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: materialAttribute.id, value: 'Acero Inoxidable' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: materialAttribute.id, value: 'Plástico' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: materialAttribute.id, value: 'Madera' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: materialAttribute.id, value: 'Grafito' },
    }),
  ]);

  const capacityValues = await Promise.all([
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '1L' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '2L' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '10 tazas' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '20L' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '3.5L' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '1000L' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '1kg' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '5kg' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '30g' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '10000mAh' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '5L' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '10L' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '1.5L' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '50ml' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '100ml' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '200ml' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '250ml' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '500ml' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '2kg' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '4kg' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '6kg' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '10kg' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '15kg' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '20kg' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: capacityAttribute.id, value: '7L' },
    }),
  ]);

  const flavorValues = await Promise.all([
    prisma.productAttributeValue.create({
      data: { attributeId: flavorAttribute.id, value: 'Vainilla' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: flavorAttribute.id, value: 'Chocolate' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: flavorAttribute.id, value: 'Fresa' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: flavorAttribute.id, value: 'Mango' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: flavorAttribute.id, value: 'Lavanda' },
    }),
    prisma.productAttributeValue.create({
      data: { attributeId: flavorAttribute.id, value: 'Cítrico' },
    }),
  ]);
  console.log(
    `✅ Created 6 attributes with ${colorValues.length + sizeValues.length + storageValues.length + materialValues.length + capacityValues.length + flavorValues.length} values\n`,
  );

  // ==================== PRODUCTS ====================
  console.log('📦 Creating products...');

  const productData = [
    // Electrónica (0-9)
    [
      {
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: 'El iPhone más avanzado con chip A17 Pro.',
        shortDescription: 'iPhone 15 Pro con chip A17 Pro',
        price: 4999.0,
        compareAtPrice: 5499.0,
        attributes: [storageAttribute.id, colorAttribute.id],
        values: [
          ['128GB', '256GB', '512GB'],
          ['Negro', 'Blanco', 'Azul'],
        ],
        image:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
      },
      {
        name: 'MacBook Air M3',
        slug: 'macbook-air-m3',
        description: 'MacBook Air con chip M3.',
        shortDescription: 'MacBook Air M3',
        price: 5999.0,
        compareAtPrice: 6499.0,
        attributes: [storageAttribute.id],
        values: [['256GB', '512GB', '1TB']],
        image:
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500',
      },
      {
        name: 'Samsung Galaxy S24',
        slug: 'samsung-galaxy-s24',
        description: 'Samsung Galaxy S24.',
        shortDescription: 'Samsung Galaxy S24',
        price: 3999.0,
        attributes: [storageAttribute.id, colorAttribute.id],
        values: [
          ['128GB', '256GB'],
          ['Negro', 'Blanco'],
        ],
        image:
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500',
      },
      {
        name: 'iPad Pro',
        slug: 'ipad-pro',
        description: 'iPad Pro con M2.',
        shortDescription: 'iPad Pro M2',
        price: 3499.0,
        attributes: [storageAttribute.id],
        values: [['128GB', '256GB', '512GB']],
        image:
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500',
      },
      {
        name: 'AirPods Pro',
        slug: 'airpods-pro',
        description: 'AirPods Pro.',
        shortDescription: 'AirPods Pro',
        price: 899.0,
        attributes: [colorAttribute.id],
        values: [['Blanco']],
        image:
          'https://images.unsplash.com/photo-1606220945770-b5b6c2c9eaef?w=500',
      },
      {
        name: 'Apple Watch Series 9',
        slug: 'apple-watch-series-9',
        description: 'Apple Watch Series 9.',
        shortDescription: 'Apple Watch Series 9',
        price: 1299.0,
        attributes: [colorAttribute.id],
        values: [['Negro', 'Blanco', 'Azul']],
        image:
          'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500',
      },
      {
        name: 'Sony WH-1000XM5',
        slug: 'sony-wh-1000xm5',
        description: 'Audífonos Sony WH-1000XM5.',
        shortDescription: 'Sony WH-1000XM5',
        price: 1499.0,
        attributes: [colorAttribute.id],
        values: [['Negro', 'Blanco']],
        image:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      },
      {
        name: 'Nintendo Switch OLED',
        slug: 'nintendo-switch-oled',
        description: 'Nintendo Switch OLED.',
        shortDescription: 'Nintendo Switch OLED',
        price: 1299.0,
        attributes: [colorAttribute.id],
        values: [['Blanco']],
        image:
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
      },
      {
        name: 'GoPro HERO11',
        slug: 'gopro-hero11',
        description: 'Cámara GoPro HERO11.',
        shortDescription: 'GoPro HERO11',
        price: 1999.0,
        attributes: [colorAttribute.id],
        values: [['Negro']],
        image:
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500',
      },
      {
        name: 'Kindle Paperwhite',
        slug: 'kindle-paperwhite',
        description: 'Kindle Paperwhite.',
        shortDescription: 'Kindle Paperwhite',
        price: 499.0,
        attributes: [storageAttribute.id],
        values: [['8GB', '16GB']],
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      },
    ],
    // Ropa (10-19)
    [
      {
        name: 'Polo Algodón Pima',
        slug: 'polo-algodon-pima',
        description: 'Polo de algodón pima.',
        shortDescription: 'Polo algodón pima',
        price: 89.9,
        compareAtPrice: 119.9,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['S', 'M', 'L', 'XL'],
          ['Negro', 'Blanco', 'Azul', 'Rojo'],
        ],
        image:
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      },
      {
        name: 'Jeans Clásicos',
        slug: 'jeans-clasicos',
        description: 'Jeans clásicos.',
        shortDescription: 'Jeans clásicos',
        price: 149.9,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['28', '30', '32', '34'],
          ['Azul', 'Negro'],
        ],
        image:
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
      },
      {
        name: 'Chaqueta de Cuero',
        slug: 'chaqueta-cuero',
        description: 'Chaqueta de cuero.',
        shortDescription: 'Chaqueta cuero',
        price: 299.9,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['M', 'L', 'XL'],
          ['Negro', 'Marrón'],
        ],
        image:
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
      },
      {
        name: 'Vestido Elegante',
        slug: 'vestido-elegante',
        description: 'Vestido elegante.',
        shortDescription: 'Vestido elegante',
        price: 199.9,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['S', 'M', 'L'],
          ['Negro', 'Rojo', 'Azul'],
        ],
        image:
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
      },
      {
        name: 'Zapatillas Deportivas',
        slug: 'zapatillas-deportivas',
        description: 'Zapatillas deportivas.',
        shortDescription: 'Zapatillas deportivas',
        price: 249.9,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['38', '40', '42', '44'],
          ['Blanco', 'Negro', 'Azul'],
        ],
        image:
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
      },
      {
        name: 'Camisa Formal',
        slug: 'camisa-formal',
        description: 'Camisa formal.',
        shortDescription: 'Camisa formal',
        price: 129.9,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['S', 'M', 'L', 'XL'],
          ['Blanco', 'Azul', 'Gris'],
        ],
        image:
          'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500',
      },
      {
        name: 'Sudadera con Capucha',
        slug: 'sudadera-capucha',
        description: 'Sudadera con capucha.',
        shortDescription: 'Sudadera capucha',
        price: 179.9,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['M', 'L', 'XL'],
          ['Negro', 'Gris', 'Azul'],
        ],
        image:
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
      },
      {
        name: 'Falda Plisada',
        slug: 'falda-plisada',
        description: 'Falda plisada.',
        shortDescription: 'Falda plisada',
        price: 159.9,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['S', 'M', 'L'],
          ['Negro', 'Beige'],
        ],
        image:
          'https://images.unsplash.com/photo-1583496661160-fb5886a6aaaa?w=500',
      },
      {
        name: 'Traje de Baño',
        slug: 'traje-bano',
        description: 'Traje de baño.',
        shortDescription: 'Traje baño',
        price: 99.9,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['S', 'M', 'L'],
          ['Azul', 'Rojo', 'Negro'],
        ],
        image:
          'https://images.unsplash.com/photo-1562887538-5fe2e6b3b1b7?w=500',
      },
      {
        name: 'Abrigo de Lana',
        slug: 'abrigo-lana',
        description: 'Abrigo de lana.',
        shortDescription: 'Abrigo lana',
        price: 399.9,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['M', 'L', 'XL'],
          ['Negro', 'Gris', 'Marrón'],
        ],
        image:
          'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500',
      },
    ],
    // Hogar (20-29)
    [
      {
        name: 'Cafetera Italiana',
        slug: 'cafetera-italiana',
        description: 'Cafetera italiana.',
        shortDescription: 'Cafetera italiana',
        price: 159.0,
        compareAtPrice: 199.0,
        attributes: [materialAttribute.id, capacityAttribute.id],
        values: [['Acero Inoxidable'], ['1L', '2L']],
        image:
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
      },
      {
        name: 'Lámpara de Mesa',
        slug: 'lampara-mesa',
        description: 'Lámpara de mesa.',
        shortDescription: 'Lámpara mesa',
        price: 89.9,
        attributes: [colorAttribute.id],
        values: [['Blanco', 'Negro']],
        image:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      },
      {
        name: 'Juego de Sábanas',
        slug: 'juego-sabanas',
        description: 'Juego de sábanas.',
        shortDescription: 'Juego sábanas',
        price: 199.9,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['Queen', 'King'],
          ['Blanco', 'Gris'],
        ],
        image:
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
      },
      {
        name: 'Sofá Modular',
        slug: 'sofa-modular',
        description: 'Sofá modular.',
        shortDescription: 'Sofá modular',
        price: 2499.0,
        attributes: [colorAttribute.id],
        values: [['Gris', 'Beige']],
        image:
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
      },
      {
        name: 'Mesa de Comedor',
        slug: 'mesa-comedor',
        description: 'Mesa de comedor.',
        shortDescription: 'Mesa comedor',
        price: 899.0,
        attributes: [materialAttribute.id],
        values: [['Madera']],
        image:
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
      },
      {
        name: 'Aspiradora Robot',
        slug: 'aspiradora-robot',
        description: 'Aspiradora robot.',
        shortDescription: 'Aspiradora robot',
        price: 799.0,
        attributes: [colorAttribute.id],
        values: [['Blanco', 'Negro']],
        image:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      },
      {
        name: 'Cortinas Opacas',
        slug: 'cortinas-opacas',
        description: 'Cortinas opacas.',
        shortDescription: 'Cortinas opacas',
        price: 149.9,
        attributes: [colorAttribute.id],
        values: [['Blanco', 'Gris', 'Azul']],
        image:
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
      },
      {
        name: 'Juego de Ollas',
        slug: 'juego-ollas',
        description: 'Juego de ollas.',
        shortDescription: 'Juego ollas',
        price: 299.9,
        attributes: [materialAttribute.id],
        values: [['Acero Inoxidable']],
        image:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      },
      {
        name: 'Alfombra Moderna',
        slug: 'alfombra-moderna',
        description: 'Alfombra moderna.',
        shortDescription: 'Alfombra moderna',
        price: 249.9,
        attributes: [colorAttribute.id],
        values: [['Gris', 'Beige']],
        image:
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
      },
      {
        name: 'Reloj de Pared',
        slug: 'reloj-pared',
        description: 'Reloj de pared.',
        shortDescription: 'Reloj pared',
        price: 79.9,
        attributes: [colorAttribute.id],
        values: [['Blanco', 'Negro']],
        image:
          'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500',
      },
    ],
    // Deportes (30-39)
    [
      {
        name: 'Mancuernas Ajustables',
        slug: 'mancuernas-ajustables',
        description: 'Mancuernas ajustables.',
        shortDescription: 'Mancuernas ajustables',
        price: 349.0,
        attributes: [capacityAttribute.id],
        values: [['5kg', '10kg', '15kg', '20kg']],
        image:
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
      },
      {
        name: 'Bicicleta de Montaña',
        slug: 'bicicleta-montana',
        description: 'Bicicleta de montaña.',
        shortDescription: 'Bicicleta montaña',
        price: 1499.0,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['M', 'L'],
          ['Rojo', 'Azul'],
        ],
        image:
          'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500',
      },
      {
        name: 'Pelota de Fútbol',
        slug: 'pelota-futbol',
        description: 'Pelota de fútbol.',
        shortDescription: 'Pelota fútbol',
        price: 89.9,
        attributes: [colorAttribute.id],
        values: [['Blanco']],
        image:
          'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=500',
      },
      {
        name: 'Raqueta de Tenis',
        slug: 'raqueta-tenis',
        description: 'Raqueta de tenis.',
        shortDescription: 'Raqueta tenis',
        price: 299.9,
        attributes: [materialAttribute.id],
        values: [['Grafito']],
        image:
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500',
      },
      {
        name: 'Colchoneta de Yoga',
        slug: 'colchoneta-yoga',
        description: 'Colchoneta de yoga.',
        shortDescription: 'Colchoneta yoga',
        price: 79.9,
        attributes: [colorAttribute.id],
        values: [['Morado', 'Azul', 'Verde']],
        image:
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500',
      },
      {
        name: 'Pesas Rusas',
        slug: 'pesas-rusas',
        description: 'Pesas rusas.',
        shortDescription: 'Pesas rusas',
        price: 149.9,
        attributes: [capacityAttribute.id],
        values: [['2kg', '4kg', '6kg']],
        image:
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
      },
      {
        name: 'Cuerda de Saltar',
        slug: 'cuerda-saltar',
        description: 'Cuerda de saltar.',
        shortDescription: 'Cuerda saltar',
        price: 29.9,
        attributes: [colorAttribute.id],
        values: [['Negro', 'Rojo']],
        image:
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
      },
      {
        name: 'Guantes de Boxeo',
        slug: 'guantes-boxeo',
        description: 'Guantes de boxeo.',
        shortDescription: 'Guantes boxeo',
        price: 199.9,
        attributes: [sizeAttribute.id, colorAttribute.id],
        values: [
          ['M', 'L'],
          ['Rojo', 'Negro'],
        ],
        image:
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
      },
      {
        name: 'Banda Elástica',
        slug: 'banda-elastica',
        description: 'Banda elástica.',
        shortDescription: 'Banda elástica',
        price: 49.9,
        attributes: [colorAttribute.id],
        values: [['Morado', 'Verde', 'Azul']],
        image:
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
      },
      {
        name: 'Balón de Baloncesto',
        slug: 'balon-baloncesto',
        description: 'Balón de baloncesto.',
        shortDescription: 'Balón baloncesto',
        price: 129.9,
        attributes: [sizeAttribute.id],
        values: [['7']],
        image:
          'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=500',
      },
    ],
    // Libros (40-49)
    [
      {
        name: 'El Principito',
        slug: 'el-principito',
        description: 'Clásico de Antoine de Saint-Exupéry.',
        shortDescription: 'El Principito',
        price: 29.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      },
      {
        name: '1984',
        slug: '1984',
        description: 'Novela de George Orwell.',
        shortDescription: '1984',
        price: 39.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      },
      {
        name: 'Cien Años de Soledad',
        slug: 'cien-anos-soledad',
        description: 'Novela de Gabriel García Márquez.',
        shortDescription: 'Cien Años de Soledad',
        price: 49.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      },
      {
        name: 'Harry Potter y la Piedra Filosofal',
        slug: 'harry-potter-piedra-filosofal',
        description: 'Primer libro de la saga Harry Potter.',
        shortDescription: 'Harry Potter 1',
        price: 59.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      },
      {
        name: 'El Código Da Vinci',
        slug: 'codigo-da-vinci',
        description: 'Novela de Dan Brown.',
        shortDescription: 'El Código Da Vinci',
        price: 44.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      },
      {
        name: 'Orgullo y Prejuicio',
        slug: 'orgullo-prejuicio',
        description: 'Novela de Jane Austen.',
        shortDescription: 'Orgullo y Prejuicio',
        price: 34.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      },
      {
        name: 'El Señor de los Anillos',
        slug: 'senor-anillos',
        description: 'Trilogía de J.R.R. Tolkien.',
        shortDescription: 'El Señor de los Anillos',
        price: 89.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      },
      {
        name: 'Don Quijote',
        slug: 'don-quijote',
        description: 'Clásico de Miguel de Cervantes.',
        shortDescription: 'Don Quijote',
        price: 69.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      },
      {
        name: 'La Sombra del Viento',
        slug: 'sombra-viento',
        description: 'Novela de Carlos Ruiz Zafón.',
        shortDescription: 'La Sombra del Viento',
        price: 54.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      },
      {
        name: 'El Alquimista',
        slug: 'el-alquimista',
        description: 'Novela de Paulo Coelho.',
        shortDescription: 'El Alquimista',
        price: 39.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      },
    ],
    // Belleza (50-59)
    [
      {
        name: 'Crema Hidratante',
        slug: 'crema-hidratante',
        description: 'Crema hidratante para piel seca.',
        shortDescription: 'Crema hidratante',
        price: 49.9,
        attributes: [capacityAttribute.id],
        values: [['50ml', '100ml']],
        image:
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
      },
      {
        name: 'Máscara de Pestañas',
        slug: 'mascara-pestanas',
        description: 'Máscara de pestañas volumizadora.',
        shortDescription: 'Máscara pestañas',
        price: 29.9,
        attributes: [colorAttribute.id],
        values: [['Negro']],
        image:
          'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
      },
      {
        name: 'Perfume Mujer',
        slug: 'perfume-mujer',
        description: 'Perfume floral para mujer.',
        shortDescription: 'Perfume mujer',
        price: 149.9,
        attributes: [capacityAttribute.id],
        values: [['50ml', '100ml']],
        image:
          'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500',
      },
      {
        name: 'Shampoo Anticaspa',
        slug: 'shampoo-anticaspa',
        description: 'Shampoo para caspa.',
        shortDescription: 'Shampoo anticaspa',
        price: 39.9,
        attributes: [capacityAttribute.id],
        values: [['250ml', '500ml']],
        image:
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
      },
      {
        name: 'Base de Maquillaje',
        slug: 'base-maquillaje',
        description: 'Base de maquillaje.',
        shortDescription: 'Base maquillaje',
        price: 79.9,
        attributes: [colorAttribute.id],
        values: [['Beige Claro', 'Beige Medio']],
        image:
          'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
      },
      {
        name: 'Crema Solar',
        slug: 'crema-solar',
        description: 'Crema solar SPF 50.',
        shortDescription: 'Crema solar',
        price: 59.9,
        attributes: [capacityAttribute.id],
        values: [['200ml']],
        image:
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
      },
      {
        name: 'Esmalte de Uñas',
        slug: 'esmalte-unas',
        description: 'Esmalte de uñas rojo.',
        shortDescription: 'Esmalte uñas',
        price: 19.9,
        attributes: [colorAttribute.id],
        values: [['Rojo', 'Rosa', 'Negro']],
        image:
          'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
      },
      {
        name: 'Aceite para Cabello',
        slug: 'aceite-cabello',
        description: 'Aceite nutritivo para cabello.',
        shortDescription: 'Aceite cabello',
        price: 69.9,
        attributes: [capacityAttribute.id],
        values: [['100ml']],
        image:
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
      },
      {
        name: 'Desodorante Roll-on',
        slug: 'desodorante-roll-on',
        description: 'Desodorante roll-on.',
        shortDescription: 'Desodorante roll-on',
        price: 24.9,
        attributes: [flavorAttribute.id],
        values: [['Lavanda', 'Cítrico']],
        image:
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
      },
      {
        name: 'Mascarilla Facial',
        slug: 'mascarilla-facial',
        description: 'Mascarilla hidratante.',
        shortDescription: 'Mascarilla facial',
        price: 34.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
      },
    ],
    // Jardín (60-69)
    [
      {
        name: 'Maceta de Cerámica',
        slug: 'maceta-ceramica',
        description: 'Maceta de cerámica.',
        shortDescription: 'Maceta cerámica',
        price: 49.9,
        attributes: [capacityAttribute.id, colorAttribute.id],
        values: [
          ['5L', '10L'],
          ['Blanco', 'Terracota'],
        ],
        image:
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500',
      },
      {
        name: 'Tijeras de Jardín',
        slug: 'tijeras-jardin',
        description: 'Tijeras de jardín.',
        shortDescription: 'Tijeras jardín',
        price: 39.9,
        attributes: [materialAttribute.id],
        values: [['Acero Inoxidable']],
        image:
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500',
      },
      {
        name: 'Regadera',
        slug: 'regadera',
        description: 'Regadera de jardín.',
        shortDescription: 'Regadera',
        price: 29.9,
        attributes: [capacityAttribute.id],
        values: [['2L', '5L']],
        image:
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500',
      },
      {
        name: 'Semillas de Tomate',
        slug: 'semillas-tomate',
        description: 'Semillas de tomate.',
        shortDescription: 'Semillas tomate',
        price: 9.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500',
      },
      {
        name: 'Mesa de Jardín',
        slug: 'mesa-jardin',
        description: 'Mesa de jardín.',
        shortDescription: 'Mesa jardín',
        price: 299.9,
        attributes: [materialAttribute.id],
        values: [['Madera']],
        image:
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
      },
      {
        name: 'Barbacoa Portátil',
        slug: 'barbacoa-portatil',
        description: 'Barbacoa portátil.',
        shortDescription: 'Barbacoa portátil',
        price: 199.9,
        attributes: [materialAttribute.id],
        values: [['Acero Inoxidable']],
        image:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      },
      {
        name: 'Guantes de Jardín',
        slug: 'guantes-jardin',
        description: 'Guantes de jardín.',
        shortDescription: 'Guantes jardín',
        price: 19.9,
        attributes: [sizeAttribute.id],
        values: [['M', 'L']],
        image:
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500',
      },
      {
        name: 'Fertilizante Orgánico',
        slug: 'fertilizante-organico',
        description: 'Fertilizante orgánico.',
        shortDescription: 'Fertilizante orgánico',
        price: 24.9,
        attributes: [capacityAttribute.id],
        values: [['1kg', '5kg']],
        image:
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500',
      },
      {
        name: 'Hamaca',
        slug: 'hamaca',
        description: 'Hamaca para jardín.',
        shortDescription: 'Hamaca',
        price: 149.9,
        attributes: [colorAttribute.id],
        values: [['Verde', 'Azul']],
        image:
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500',
      },
      {
        name: 'Piscina Inflable',
        slug: 'piscina-inflable',
        description: 'Piscina inflable.',
        shortDescription: 'Piscina inflable',
        price: 99.9,
        attributes: [capacityAttribute.id],
        values: [['1000L']],
        image:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      },
    ],
    // Cocina (70-79)
    [
      {
        name: 'Olla a Presión',
        slug: 'olla-presion',
        description: 'Olla a presión.',
        shortDescription: 'Olla presión',
        price: 149.9,
        attributes: [capacityAttribute.id, materialAttribute.id],
        values: [['5L', '7L'], ['Acero Inoxidable']],
        image:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      },
      {
        name: 'Batidora de Mano',
        slug: 'batidora-mano',
        description: 'Batidora de mano.',
        shortDescription: 'Batidora mano',
        price: 79.9,
        attributes: [colorAttribute.id],
        values: [['Blanco', 'Negro']],
        image:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      },
      {
        name: 'Tostadora',
        slug: 'tostadora',
        description: 'Tostadora eléctrica.',
        shortDescription: 'Tostadora',
        price: 89.9,
        attributes: [colorAttribute.id],
        values: [['Plateado']],
        image:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      },
      {
        name: 'Licuadora',
        slug: 'licuadora',
        description: 'Licuadora potente.',
        shortDescription: 'Licuadora',
        price: 199.9,
        attributes: [capacityAttribute.id],
        values: [['1.5L']],
        image:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      },
      {
        name: 'Cafetera de Goteo',
        slug: 'cafetera-goteo',
        description: 'Cafetera de goteo.',
        shortDescription: 'Cafetera goteo',
        price: 129.9,
        attributes: [capacityAttribute.id],
        values: [['10 tazas']],
        image:
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
      },
      {
        name: 'Horno Microondas',
        slug: 'horno-microondas',
        description: 'Horno microondas.',
        shortDescription: 'Microondas',
        price: 299.9,
        attributes: [capacityAttribute.id],
        values: [['20L']],
        image:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      },
      {
        name: 'Plancha Eléctrica',
        slug: 'plancha-electrica',
        description: 'Plancha eléctrica.',
        shortDescription: 'Plancha eléctrica',
        price: 59.9,
        attributes: [colorAttribute.id],
        values: [['Azul', 'Rosa']],
        image:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      },
      {
        name: 'Exprimidor',
        slug: 'exprimidor',
        description: 'Exprimidor de cítricos.',
        shortDescription: 'Exprimidor',
        price: 49.9,
        attributes: [materialAttribute.id],
        values: [['Plástico']],
        image:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      },
      {
        name: 'Freidora de Aire',
        slug: 'freidora-aire',
        description: 'Freidora de aire.',
        shortDescription: 'Freidora aire',
        price: 249.9,
        attributes: [capacityAttribute.id],
        values: [['3.5L']],
        image:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      },
      {
        name: 'Molinillo de Café',
        slug: 'molinillo-cafe',
        description: 'Molinillo de café.',
        shortDescription: 'Molinillo café',
        price: 89.9,
        attributes: [capacityAttribute.id],
        values: [['30g']],
        image:
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500',
      },
    ],
    // Juguetes (80-89)
    [
      {
        name: 'Lego Creator',
        slug: 'lego-creator',
        description: 'Set de Lego Creator.',
        shortDescription: 'Lego Creator',
        price: 149.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500',
      },
      {
        name: 'Muñeca Barbie',
        slug: 'muneca-barbie',
        description: 'Muñeca Barbie.',
        shortDescription: 'Muñeca Barbie',
        price: 79.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500',
      },
      {
        name: 'Pelota de Fútbol',
        slug: 'pelota-futbol-juguete',
        description: 'Pelota de fútbol para niños.',
        shortDescription: 'Pelota fútbol niño',
        price: 39.9,
        attributes: [colorAttribute.id],
        values: [['Blanco']],
        image:
          'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=500',
      },
      {
        name: 'Puzzle 500 Piezas',
        slug: 'puzzle-500-piezas',
        description: 'Puzzle de 500 piezas.',
        shortDescription: 'Puzzle 500 piezas',
        price: 29.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500',
      },
      {
        name: 'Coche de Control Remoto',
        slug: 'coche-control-remoto',
        description: 'Coche de control remoto.',
        shortDescription: 'Coche control remoto',
        price: 99.9,
        attributes: [colorAttribute.id],
        values: [['Rojo', 'Azul']],
        image:
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500',
      },
      {
        name: 'Bloques de Construcción',
        slug: 'bloques-construccion',
        description: 'Bloques de construcción.',
        shortDescription: 'Bloques construcción',
        price: 49.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500',
      },
      {
        name: 'Osito de Peluche',
        slug: 'osito-peluche',
        description: 'Osito de peluche.',
        shortDescription: 'Osito peluche',
        price: 34.9,
        attributes: [colorAttribute.id],
        values: [['Marrón']],
        image:
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500',
      },
      {
        name: 'Juego de Mesa Monopoly',
        slug: 'monopoly',
        description: 'Juego de mesa Monopoly.',
        shortDescription: 'Monopoly',
        price: 89.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500',
      },
      {
        name: 'Muñeco de Acción',
        slug: 'muneco-accion',
        description: 'Muñeco de acción.',
        shortDescription: 'Muñeco acción',
        price: 24.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500',
      },
      {
        name: 'Tren Eléctrico',
        slug: 'tren-electrico',
        description: 'Tren eléctrico.',
        shortDescription: 'Tren eléctrico',
        price: 199.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500',
      },
    ],
    // Automotriz (90-99)
    [
      {
        name: 'Aceite de Motor',
        slug: 'aceite-motor',
        description: 'Aceite de motor sintético.',
        shortDescription: 'Aceite motor',
        price: 49.9,
        attributes: [capacityAttribute.id],
        values: [['1L', '5L']],
        image:
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500',
      },
      {
        name: 'Filtro de Aire',
        slug: 'filtro-aire',
        description: 'Filtro de aire para auto.',
        shortDescription: 'Filtro aire',
        price: 29.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500',
      },
      {
        name: 'Batería de Auto',
        slug: 'bateria-auto',
        description: 'Batería de auto.',
        shortDescription: 'Batería auto',
        price: 299.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500',
      },
      {
        name: 'Llantas de Aleación',
        slug: 'llantas-alecion',
        description: 'Llantas de aleación.',
        shortDescription: 'Llantas aleación',
        price: 899.9,
        attributes: [sizeAttribute.id],
        values: [['16"', '17"']],
        image:
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500',
      },
      {
        name: 'Limpiaparabrisas',
        slug: 'limpiaparabrisas',
        description: 'Limpiaparabrisas.',
        shortDescription: 'Limpiaparabrisas',
        price: 39.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500',
      },
      {
        name: 'Tapetes para Auto',
        slug: 'tapetes-auto',
        description: 'Tapetes para auto.',
        shortDescription: 'Tapetes auto',
        price: 79.9,
        attributes: [colorAttribute.id],
        values: [['Negro', 'Gris']],
        image:
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500',
      },
      {
        name: 'Sistema de Audio',
        slug: 'sistema-audio',
        description: 'Sistema de audio para auto.',
        shortDescription: 'Sistema audio',
        price: 499.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500',
      },
      {
        name: 'Cargador Portátil',
        slug: 'cargador-portatil',
        description: 'Cargador portátil para auto.',
        shortDescription: 'Cargador portátil',
        price: 149.9,
        attributes: [capacityAttribute.id],
        values: [['10000mAh']],
        image:
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500',
      },
      {
        name: 'Kit de Herramientas',
        slug: 'kit-herramientas',
        description: 'Kit de herramientas para auto.',
        shortDescription: 'Kit herramientas',
        price: 199.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500',
      },
      {
        name: 'GPS para Auto',
        slug: 'gps-auto',
        description: 'GPS para auto.',
        shortDescription: 'GPS auto',
        price: 399.9,
        attributes: [],
        values: [],
        image:
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500',
      },
    ],
  ];

  const allProducts: any[] = [];
  const allVariants: any[] = [];
  const allImages: any[] = [];

  for (let catIndex = 0; catIndex < categories.length; catIndex++) {
    const category = categories[catIndex];
    const productsInCat = productData[catIndex];

    for (let prodIndex = 0; prodIndex < productsInCat.length; prodIndex++) {
      const prodData = productsInCat[prodIndex];
      const product = await prisma.product.create({
        data: {
          name: prodData.name,
          slug: prodData.slug,
          description: prodData.description,
          shortDescription: prodData.shortDescription,
          price: prodData.price,
          compareAtPrice: prodData.compareAtPrice || null,
          stock: 0,
          isActive: true,
          hasVariants: prodData.attributes.length > 0,
          categoryId: category.id,
        },
      });
      allProducts.push(product);

      if (prodData.attributes.length > 0) {
        // Create variants
        const variants: any[] = [];
        const attr1Values = prodData.values[0] || [];
        const attr2Values = prodData.values[1] || [];

        if (attr2Values.length > 0) {
          for (const val1 of attr1Values) {
            for (const val2 of attr2Values) {
              const variant = await prisma.productVariant.create({
                data: {
                  productId: product.id,
                  sku: `${prodData.slug}-${val1}-${val2}`
                    .replace(/\s/g, '')
                    .toUpperCase(),
                  price: prodData.price,
                  stock: Math.floor(Math.random() * 50) + 10,
                  isActive: true,
                },
              });
              variants.push(variant);

              // Link attributes
              const attrValue1 = await prisma.productAttributeValue.findFirst({
                where: { value: val1 },
              });
              const attrValue2 = await prisma.productAttributeValue.findFirst({
                where: { value: val2 },
              });
              if (attrValue1) {
                await prisma.variantAttributeValue.create({
                  data: {
                    variantId: variant.id,
                    attributeValueId: attrValue1.id,
                  },
                });
              }
              if (attrValue2) {
                await prisma.variantAttributeValue.create({
                  data: {
                    variantId: variant.id,
                    attributeValueId: attrValue2.id,
                  },
                });
              }
            }
          }
        } else {
          for (const val of attr1Values) {
            const variant = await prisma.productVariant.create({
              data: {
                productId: product.id,
                sku: `${prodData.slug}-${val}`.replace(/\s/g, '').toUpperCase(),
                price: prodData.price,
                stock: Math.floor(Math.random() * 50) + 10,
                isActive: true,
              },
            });
            variants.push(variant);

            const attrValue = await prisma.productAttributeValue.findFirst({
              where: { value: val },
            });
            if (attrValue) {
              await prisma.variantAttributeValue.create({
                data: {
                  variantId: variant.id,
                  attributeValueId: attrValue.id,
                },
              });
            }
          }
        }
        allVariants.push(...variants);
      } else {
        // No variants, set stock on product
        await prisma.product.update({
          where: { id: product.id },
          data: { stock: Math.floor(Math.random() * 50) + 10 },
        });
      }

      // Create image
      const image = await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `https://picsum.photos/seed/${prodData.slug}/500/500`,
          publicId: `products/${prodData.slug}`,
          alt: prodData.name,
          width: 500,
          height: 500,
          displayOrder: 1,
        },
      });
      allImages.push(image);
    }
  }

  console.log(`✅ Created ${allProducts.length} products with variants\n`);

  // ==================== PRODUCT IMAGES ====================
  console.log('🖼️ Creating product images...');
  console.log(`✅ Created ${allImages.length} product images\n`);

  // Find specific variants for orders
  const iphoneVariant = allVariants.find(
    (v) => v.productId === allProducts[0].id && v.sku.includes('NEGRO-128GB'),
  );
  const poloVariant = allVariants.find(
    (v) => v.productId === allProducts[10].id && v.sku.includes('NEGRO-M'),
  );
  const laptopVariant = allVariants.find(
    (v) => v.productId === allProducts[1].id && v.sku.includes('256GB'),
  );

  // ==================== STOCK ALERTS ====================
  console.log('🔔 Creating stock alerts...');
  await Promise.all([
    prisma.stockAlert.create({
      data: {
        productId: allProducts[20].id,
        lowStockThreshold: 10,
        criticalStockThreshold: 3,
        alertEnabled: true,
      },
    }),
    prisma.stockAlert.create({
      data: {
        productId: allProducts[1].id,
        lowStockThreshold: 5,
        criticalStockThreshold: 2,
        alertEnabled: true,
      },
    }),
    prisma.stockAlert.create({
      data: {
        variantId: iphoneVariant?.id,
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
            productId: allProducts[10].id, // Polo
            variantId: allVariants.find(
              (v) => v.productId === allProducts[10].id,
            )?.id,
            quantity: 2,
          },
          {
            productId: allProducts[30].id, // Mancuernas
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
            productId: allProducts[20].id, // Cafetera
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
        recipientPhone: '+51912345678',
        street: 'Av. Javier Prado Este',
        number: '1234',
        apartment: 'Dpto 501',
        district: 'San Isidro',
        city: 'Lima',
        department: 'Lima',
        postalCode: '15036',
      },
      subtotal: 5088.9,
      shippingCost: 15.0,
      discount: 0,
      total: 5103.9,
      deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  });

  await Promise.all([
    prisma.orderItem.create({
      data: {
        orderId: order1.id,
        productId: allProducts[0].id,
        variantId: iphoneVariant?.id,
        productName: allProducts[0].name,
        variantAttributes: { Color: 'Negro', Almacenamiento: '128GB' },
        quantity: 1,
        unitPrice: 4999.0,
        subtotal: 4999.0,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: order1.id,
        productId: allProducts[10].id,
        variantId: poloVariant?.id,
        productName: allProducts[10].name,
        variantAttributes: { Color: 'Negro', Talla: 'M' },
        quantity: 1,
        unitPrice: 89.9,
        subtotal: 89.9,
      },
    }),
  ]);

  // Payment for order 1
  await prisma.payment.create({
    data: {
      orderId: order1.id,
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.COMPLETED,
      amount: 5103.9,
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
      shippingCost: 15.0,
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
        recipientPhone: '+51987654321',
        street: 'Av. Arequipa',
        number: '2500',
        district: 'Miraflores',
        city: 'Lima',
        department: 'Lima',
      },
      subtotal: 6348.0,
      shippingCost: 0,
      discount: 30.0,
      discountCode: 'VERANO2025',
      total: 6318.0,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      productId: allProducts[1].id,
      variantId: laptopVariant?.id,
      productName: allProducts[1].name,
      variantAttributes: { Almacenamiento: '256GB' },
      quantity: 1,
      unitPrice: 5999.0,
      subtotal: 5999.0,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      productId: allProducts[30].id,
      productName: allProducts[30].name,
      quantity: 1,
      unitPrice: 349.0,
      subtotal: 349.0,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order2.id,
      method: PaymentMethod.MERCADOPAGO,
      status: PaymentStatus.COMPLETED,
      amount: 6318.0,
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
      discountApplied: 30.0,
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
        recipientPhone: '+51956789012',
        street: 'Av. El Sol',
        number: '800',
        district: 'Cusco',
        city: 'Cusco',
        department: 'Cusco',
        reference: 'A 2 cuadras de la Plaza de Armas',
      },
      subtotal: 159.0,
      shippingCost: 25.0,
      discount: 0,
      total: 184.0,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order3.id,
      productId: allProducts[20].id,
      productName: allProducts[20].name,
      quantity: 1,
      unitPrice: 159.0,
      subtotal: 159.0,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order3.id,
      method: PaymentMethod.CASH_ON_DELIVERY,
      status: PaymentStatus.PENDING,
      amount: 184.0,
      currency: 'PEN',
    },
  });
  console.log(`✅ Created orders with payments and shipments\n`);

  // ==================== INVENTORY MOVEMENTS ====================
  console.log('📊 Creating inventory movements...');
  await prisma.inventoryMovement.createMany({
    data: [
      {
        productId: allProducts[0].id,
        variantId: iphoneVariant?.id,
        type: MovementType.PURCHASE,
        quantity: 20,
        previousStock: 0,
        newStock: 20,
        referenceNumber: 'PO-2025-001',
        notes: 'Compra inicial de inventario',
        performedBy: adminUser.id,
        unitCost: 3500.0,
      },
      {
        productId: allProducts[0].id,
        variantId: iphoneVariant?.id,
        type: MovementType.SALE,
        quantity: -1,
        previousStock: 20,
        newStock: 19,
        orderId: order1.id,
        notes: 'Venta orden ORD-2025-0001',
      },
      {
        productId: allProducts[10].id,
        variantId: poloVariant?.id,
        type: MovementType.PURCHASE,
        quantity: 50,
        previousStock: 0,
        newStock: 50,
        referenceNumber: 'PO-2025-002',
        performedBy: adminUser.id,
        unitCost: 35.0,
      },
      {
        productId: allProducts[1].id,
        variantId: laptopVariant?.id,
        type: MovementType.PURCHASE,
        quantity: 15,
        previousStock: 0,
        newStock: 15,
        referenceNumber: 'PO-2025-003',
        performedBy: adminUser.id,
        unitCost: 4200.0,
      },
      {
        productId: allProducts[1].id,
        variantId: laptopVariant?.id,
        type: MovementType.RESERVATION,
        quantity: -1,
        previousStock: 15,
        newStock: 14,
        orderId: order2.id,
        notes: 'Reserva para orden ORD-2025-0002',
      },
      {
        productId: allProducts[20].id,
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
        productId: allProducts[0].id,
        rating: 5,
        title: '¡Excelente teléfono!',
        comment:
          'Increíble calidad de cámara y rendimiento. El envío fue muy rápido. Totalmente recomendado.',
        isVerifiedPurchase: true,
        isApproved: true,
        helpfulCount: 12,
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[0].id,
        productId: allProducts[10].id,
        rating: 5,
        title: 'El mejor polo que he comprado',
        comment:
          'La calidad del algodón pima es incomparable. Muy suave y cómodo.',
        isVerifiedPurchase: true,
        isApproved: true,
        helpfulCount: 8,
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[1].id,
        productId: allProducts[1].id,
        rating: 4,
        title: 'Muy buena laptop',
        comment:
          'Excelente rendimiento para trabajo. El único punto en contra es que podría tener más puertos USB.',
        isVerifiedPurchase: true,
        isApproved: true,
        helpfulCount: 5,
        adminResponse:
          '¡Gracias por tu feedback! Te recomendamos el hub USB-C que tenemos disponible.',
        adminResponseAt: new Date(),
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[2].id,
        productId: allProducts[30].id,
        rating: 5,
        title: 'Perfectas para casa',
        comment:
          'Excelente relación calidad-precio. El ajuste de peso es muy fácil.',
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
        productId: allProducts[1].id,
        priceWhenAdded: 5999.0,
        notifyOnPriceDrop: true,
        notifyOnBackInStock: false,
        notes: 'Para el próximo año',
      },
    }),
    prisma.wishlistItem.create({
      data: {
        userId: customers[1].id,
        productId: allProducts[0].id,
        variantId: iphoneVariant?.id,
        priceWhenAdded: 4999.0,
        notifyOnPriceDrop: true,
        notifyOnBackInStock: false,
      },
    }),
    prisma.wishlistItem.create({
      data: {
        userId: customers[2].id,
        productId: allProducts[10].id,
        variantId: poloVariant?.id,
        priceWhenAdded: 89.9,
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
  console.log(
    `   📊 Inventory Movements: ${await prisma.inventoryMovement.count()}`,
  );
  console.log(`   🔔 Stock Alerts: ${await prisma.stockAlert.count()}`);
  console.log(`   ⭐ Reviews: ${await prisma.review.count()}`);
  console.log(`   🎟️  Coupons: ${await prisma.coupon.count()}`);
  console.log(`   💝 Wishlist Items: ${await prisma.wishlistItem.count()}`);
  console.log('\n📧 Test Users:');
  console.log('   Admin: admin@tienda.pe / password123');
  console.log('   User 1: juan.perez@gmail.com / password123');
  console.log('   User 2: maria.garcia@gmail.com / password123');
  console.log('   User 3: carlos.rodriguez@gmail.com / password123');
  console.log(
    '\n🎟️  Test Coupons: BIENVENIDO10, VERANO2025, ENVIOGRATIS, TECH20',
  );
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
