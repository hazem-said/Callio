/**
 * Seed script – creates a demo account + restaurant with realistic data.
 * Run: npm run db:seed
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database…')

  // ── Demo User ────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'demo@callio.ai' },
    update: {},
    create: {
      email: 'demo@callio.ai',
      password: hashedPassword,
      name: 'Demo Owner',
    },
  })
  console.log(`✅ User: ${user.email}`)

  // ── Demo Restaurant ──────────────────────────────────────────
  const openingHours = JSON.stringify({
    mon: { open: '11:00', close: '22:00', closed: false },
    tue: { open: '11:00', close: '22:00', closed: false },
    wed: { open: '11:00', close: '22:00', closed: false },
    thu: { open: '11:00', close: '22:00', closed: false },
    fri: { open: '11:00', close: '23:00', closed: false },
    sat: { open: '10:00', close: '23:00', closed: false },
    sun: { open: '10:00', close: '21:00', closed: false },
  })

  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'demo-restaurant-1' },
    update: {},
    create: {
      id: 'demo-restaurant-1',
      name: "Mario's Bistro",
      phone: '+1 (555) 123-4567',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      cuisineType: 'Italian',
      description:
        'A cozy Italian bistro serving authentic pasta, wood-fired pizzas, and fine wines in the heart of San Francisco.',
      openingHours,
      aiName: 'Aria',
      aiGreeting:
        "Hello! Thank you for calling Mario's Bistro. I'm Aria, your AI assistant. How can I help you today?",
      aiPersonality:
        'Warm, friendly and professional. Speaks with light enthusiasm about the food. Always confirms details before booking.',
      acceptReservations: true,
      acceptOrders: true,
      maxPartySize: 12,
      reservationSlotMinutes: 30,
      plan: 'pro',
      ownerId: user.id,
    },
  })
  console.log(`✅ Restaurant: ${restaurant.name}`)

  // ── Menu Items ───────────────────────────────────────────────
  const menuItems = [
    // Starters
    { name: 'Bruschetta al Pomodoro', description: 'Toasted sourdough with fresh tomatoes, basil, garlic, and extra virgin olive oil', price: 12, category: 'Starters', isVegetarian: true, isVegan: true },
    { name: 'Burrata e Prosciutto', description: 'Creamy burrata with San Daniele prosciutto, arugula, and truffle honey', price: 18, category: 'Starters' },
    { name: 'Calamari Fritti', description: 'Crispy fried calamari with spicy marinara sauce and lemon aioli', price: 16, category: 'Starters' },
    { name: 'Minestrone Soup', description: 'Classic Italian vegetable soup with cannellini beans and pesto', price: 10, category: 'Starters', isVegetarian: true },

    // Pasta
    { name: 'Tagliatelle al Ragù', description: 'Fresh egg tagliatelle with slow-cooked Bolognese meat sauce', price: 24, category: 'Pasta' },
    { name: 'Cacio e Pepe', description: 'Tonnarelli pasta with Pecorino Romano and black pepper', price: 20, category: 'Pasta', isVegetarian: true },
    { name: 'Pappardelle ai Funghi', description: 'Wide pasta with mixed wild mushrooms, truffle oil, and Parmigiano', price: 26, category: 'Pasta', isVegetarian: true },
    { name: 'Spaghetti alle Vongole', description: 'Spaghetti with fresh clams, white wine, garlic, and parsley', price: 28, category: 'Pasta' },

    // Pizza
    { name: 'Margherita', description: 'San Marzano tomatoes, fior di latte mozzarella, fresh basil', price: 18, category: 'Pizza', isVegetarian: true },
    { name: 'Diavola', description: 'Spicy Calabrese salami, mozzarella, chili flakes, and fresh basil', price: 22, category: 'Pizza' },
    { name: 'Tartufo Bianco', description: 'White pizza with black truffle, mozzarella, arugula, and shaved Parmigiano', price: 28, category: 'Pizza', isVegetarian: true },

    // Mains
    { name: 'Branzino al Forno', description: 'Whole baked sea bass with lemon, capers, olives, and roasted potatoes', price: 38, category: 'Mains' },
    { name: 'Bistecca Fiorentina (for 2)', description: 'T-bone steak grilled over charcoal, served with rosemary roasted potatoes and salad', price: 78, category: 'Mains' },
    { name: 'Pollo alla Cacciatora', description: 'Free-range chicken braised with tomatoes, olives, capers, and white wine', price: 30, category: 'Mains' },

    // Desserts
    { name: 'Tiramisù Classico', description: "Our signature tiramisù with espresso-soaked ladyfingers, mascarpone, and cocoa", price: 12, category: 'Desserts', isVegetarian: true },
    { name: 'Panna Cotta', description: 'Vanilla panna cotta with seasonal berry compote', price: 10, category: 'Desserts', isVegetarian: true, isGlutenFree: true },
    { name: 'Gelato (3 scoops)', description: 'Ask your server for today\'s flavors', price: 9, category: 'Desserts', isVegetarian: true },

    // Drinks
    { name: 'Aperol Spritz', description: 'Aperol, Prosecco, soda, orange slice', price: 14, category: 'Drinks', isVegan: true },
    { name: 'House Red Wine (Glass)', description: 'Rotating selection of Italian reds', price: 12, category: 'Drinks', isVegan: true },
    { name: 'Sparkling Water (500ml)', description: 'San Pellegrino', price: 5, category: 'Drinks', isVegan: true, isGlutenFree: true },
    { name: 'Espresso', description: 'Double shot of Italian espresso', price: 4, category: 'Drinks', isVegan: true, isGlutenFree: true },
  ]

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: {
        id: `menu-${item.name.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`,
      },
      update: {},
      create: {
        id: `menu-${item.name.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}`,
        ...item,
        restaurantId: restaurant.id,
      },
    })
  }
  console.log(`✅ Menu: ${menuItems.length} items`)

  // ── Sample Reservations ──────────────────────────────────────
  const today = new Date()
  const fmtDate = (d: Date) => d.toISOString().split('T')[0]

  const addDays = (d: Date, n: number) => {
    const result = new Date(d)
    result.setDate(result.getDate() + n)
    return result
  }

  const reservations = [
    { guestName: 'Sarah Johnson', guestPhone: '+1-555-0101', partySize: 2, date: fmtDate(today), time: '19:00', status: 'confirmed', notes: 'Anniversary dinner' },
    { guestName: 'Michael Chen', guestPhone: '+1-555-0102', partySize: 4, date: fmtDate(today), time: '19:30', status: 'confirmed' },
    { guestName: 'Emily Rodriguez', guestPhone: '+1-555-0103', partySize: 6, date: fmtDate(today), time: '20:00', status: 'confirmed', notes: 'Birthday celebration' },
    { guestName: 'David Kim', guestPhone: '+1-555-0104', partySize: 2, date: fmtDate(addDays(today, 1)), time: '18:30', status: 'confirmed' },
    { guestName: 'Lisa Thompson', guestPhone: '+1-555-0105', partySize: 8, date: fmtDate(addDays(today, 1)), time: '19:00', status: 'confirmed' },
    { guestName: 'James Wilson', guestPhone: '+1-555-0106', partySize: 3, date: fmtDate(addDays(today, 2)), time: '20:30', status: 'confirmed' },
    { guestName: 'Sofia Martinez', guestPhone: '+1-555-0107', partySize: 2, date: fmtDate(addDays(today, -1)), time: '19:00', status: 'completed' },
    { guestName: 'Robert Davis', guestPhone: '+1-555-0108', partySize: 5, date: fmtDate(addDays(today, -1)), time: '20:00', status: 'no-show' },
  ]

  for (let i = 0; i < reservations.length; i++) {
    const r = reservations[i]
    await prisma.reservation.create({
      data: {
        ...r,
        restaurantId: restaurant.id,
      },
    })
  }
  console.log(`✅ Reservations: ${reservations.length} created`)

  // ── Sample Calls ─────────────────────────────────────────────
  const sampleTranscript = JSON.stringify([
    { role: 'assistant', content: "Hello! Thank you for calling Mario's Bistro. I'm Aria, your AI assistant. How can I help you today?", timestamp: new Date(Date.now() - 300000).toISOString() },
    { role: 'user', content: "Hi, I'd like to make a reservation for this Saturday evening for 4 people.", timestamp: new Date(Date.now() - 290000).toISOString() },
    { role: 'assistant', content: "Wonderful! I'd be happy to book a table for 4 this Saturday. What time were you thinking?", timestamp: new Date(Date.now() - 280000).toISOString() },
    { role: 'user', content: "Around 7:30 PM if possible.", timestamp: new Date(Date.now() - 270000).toISOString() },
    { role: 'assistant', content: "7:30 PM on Saturday works perfectly! May I have your name for the reservation?", timestamp: new Date(Date.now() - 260000).toISOString() },
    { role: 'user', content: "It's Michael Chen.", timestamp: new Date(Date.now() - 250000).toISOString() },
    { role: 'assistant', content: "Perfect! I've booked a table for 4 at 7:30 PM this Saturday under Michael Chen. We'll see you then! Is there anything else I can help you with?", timestamp: new Date(Date.now() - 240000).toISOString() },
    { role: 'user', content: "No, that's all. Thank you!", timestamp: new Date(Date.now() - 230000).toISOString() },
    { role: 'assistant', content: "You're welcome! We look forward to seeing you. Have a wonderful day, Michael!", timestamp: new Date(Date.now() - 220000).toISOString() },
  ])

  await prisma.call.upsert({
    where: { twilioCallSid: 'CA_demo_001' },
    update: {},
    create: {
      twilioCallSid: 'CA_demo_001',
      from: '+15550101',
      to: '+15551234567',
      status: 'completed',
      duration: 87,
      transcript: sampleTranscript,
      summary: 'Caller booked a table for 4 people on Saturday at 7:30 PM under Michael Chen.',
      outcome: 'booked-reservation',
      restaurantId: restaurant.id,
    },
  })

  await prisma.call.upsert({
    where: { twilioCallSid: 'CA_demo_002' },
    update: {},
    create: {
      twilioCallSid: 'CA_demo_002',
      from: '+15550102',
      to: '+15551234567',
      status: 'completed',
      duration: 45,
      transcript: JSON.stringify([
        { role: 'assistant', content: "Hello! Thank you for calling Mario's Bistro. I'm Aria. How can I help?", timestamp: new Date(Date.now() - 600000).toISOString() },
        { role: 'user', content: "What time do you close on Fridays?", timestamp: new Date(Date.now() - 590000).toISOString() },
        { role: 'assistant', content: "On Fridays we're open until 11 PM. Is there anything else you'd like to know?", timestamp: new Date(Date.now() - 580000).toISOString() },
        { role: 'user', content: "No that's great, thanks!", timestamp: new Date(Date.now() - 570000).toISOString() },
      ]),
      summary: 'Caller asked about Friday closing hours. Informed them we close at 11 PM.',
      outcome: 'answered-query',
      restaurantId: restaurant.id,
    },
  })

  console.log(`✅ Sample calls created`)
  console.log('\n🎉 Seed complete!')
  console.log('   Login: demo@callio.ai / password123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
