import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

function getTimerange(index: number) {
  const startHours = 8 + (index % 14) // 8AM to 10PM (14 hours)
  const endHours = startHours + 2 // 2 hour blocks
  return `${startHours}:00-${endHours}:00`
}

function generateMiamiAddress(index: number) {
  const streets = [
    'Ocean Drive', 'Collins Avenue', 'Lincoln Road', 'Washington Avenue',
    'Alton Road', 'Meridian Avenue', 'West Avenue', 'Michigan Avenue',
    'Pennsylvania Avenue', 'Dade Boulevard', 'Biscayne Boulevard',
    'Brickell Avenue', 'Coral Way', 'Flagler Street', 'Calle Ocho'
  ]
  
  const cities = ['Miami', 'Miami Beach', 'Miami Gardens', 'Miami Lakes', 'Coral Gables', 'Doral']
  const zips = ['33139', '33140', '33141', '33142', '33143', '33144', '33145', '33146']
  
  const baseLat = 25.7825
  const baseLng = -80.1344
  
  return {
    address_line: `${100 + index} ${streets[index % streets.length]}`,
    city: cities[index % cities.length],
    state: 'Florida',
    zip: zips[index % zips.length],
    latitude: baseLat + (Math.random() * 0.02 - 0.01),
    longitude: baseLng + (Math.random() * 0.02 - 0.01)
  }
}

function generateInstructor(index: number) {
  const firstNames = [
    'John', 'Maria', 'David', 'Sarah', 'Michael', 'Emma', 'James', 'Sophia',
    'William', 'Olivia', 'Robert', 'Ava', 'Daniel', 'Isabella', 'Matthew',
    'Mia', 'Joseph', 'Charlotte', 'Andrew', 'Amelia'
  ]
  
  const lastNames = [
    'Smith', 'Garcia', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
  ]
  
  return {
    first_name: firstNames[index % firstNames.length],
    last_name: lastNames[index % lastNames.length],
    email: `${firstNames[index % firstNames.length].toLowerCase()}.${lastNames[index % lastNames.length].toLowerCase()}@example.com`
  }
}

function generateAvailabilities(index: number) {
  const colors = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336', '#00BCD4', '#FF9800', '#795548']
  const availabilities = []
  
  const startDate = new Date(2025, 4, 1) // May 1st, 2025
  const numMonths = 1 + (index % 12) // 1 to 12 months
  
  for (let i = 0; i < numMonths; i++) {
    const currentDate = new Date(startDate)
    currentDate.setMonth(startDate.getMonth() + i)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    
    availabilities.push({
      start_date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      end_date: new Date(currentDate.getFullYear(), currentDate.getMonth(), lastDay),
      timerange: getTimerange(i),
      color: colors[i % colors.length]
    })
  }
  
  return availabilities
}

async function seedInstructors() {
  // Create home address tag
  const homeAddressTag = await prisma.tag.create({
    data: {
      name: 'Home Address',
      color: '#4CAF50',
      description: 'Address marked as a home address'
    }
  })

  for (let i = 0; i < 50; i++) {
    const instructor = generateInstructor(i)
    const address = generateMiamiAddress(i)

    const createdAddress = await prisma.address.create({
      data: address
    })

    // Tag the address as a home address
    await prisma.addressTag.create({
      data: {
        address_id: createdAddress.id,
        tag_id: homeAddressTag.id
      }
    })

    const createdInstructor = await prisma.instructor.create({
      data: {
        first_name: instructor.first_name,
        last_name: instructor.last_name,
        home_address_id: createdAddress.id,
        availabilities: {
          create: generateAvailabilities(i)
        }
      }
    })

    console.log(`Created instructor: ${createdInstructor.first_name} ${createdInstructor.last_name}`)
  }
}

async function main() {
  try {
    await seedInstructors()
    console.log('Seeding completed successfully')
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
