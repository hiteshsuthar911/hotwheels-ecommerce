const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

dotenv.config();

const products = [
  {
    name: "Hot Wheels Twin Mill",
    description: "The legendary Twin Mill is one of the most iconic Hot Wheels fantasy cars ever designed. This die-cast model features two massive engines and a sleek body that screams speed.",
    price: 299,
    originalPrice: 399,
    images: ["https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"],
    category: "Fantasy",
    brand: "Hot Wheels",
    series: "Legends Series",
    year: 2023,
    scale: "1:64",
    color: "Flame Orange",
    stockCount: 50,
    isFeatured: true,
    isNewArrival: true,
    rating: 4.8,
    numReviews: 24,
  },
  {
    name: "Hot Wheels '69 Camaro",
    description: "A beautifully detailed replica of the classic 1969 Chevrolet Camaro. Every curve and muscle line is faithfully reproduced in this premium die-cast model.",
    price: 499,
    originalPrice: 599,
    images: ["https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400"],
    category: "Classic",
    brand: "Hot Wheels",
    series: "Muscle Mania",
    year: 2023,
    scale: "1:64",
    color: "Rally Green",
    stockCount: 30,
    isFeatured: true,
    isNewArrival: false,
    rating: 4.9,
    numReviews: 45,
  },
  {
    name: "Hot Wheels Bone Shaker",
    description: "The iconic Bone Shaker with its skeletal body and massive engine is a must-have for every collector. This fantasy car has been reimagined in stunning detail.",
    price: 349,
    originalPrice: 0,
    images: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400"],
    category: "Fantasy",
    brand: "Hot Wheels",
    series: "Garage Series",
    year: 2023,
    scale: "1:64",
    color: "Black Chrome",
    stockCount: 25,
    isFeatured: true,
    isNewArrival: true,
    rating: 4.7,
    numReviews: 18,
  },
  {
    name: "Hot Wheels Deora III",
    description: "The futuristic Deora III concept car brought to life in die-cast form. Features solar panel details and a radical three-wheel design.",
    price: 449,
    originalPrice: 549,
    images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400"],
    category: "Fantasy",
    brand: "Hot Wheels",
    series: "Dream Garage",
    year: 2024,
    scale: "1:64",
    color: "Pearl White",
    stockCount: 15,
    isFeatured: false,
    isNewArrival: true,
    rating: 4.6,
    numReviews: 12,
  },
  {
    name: "Hot Wheels Ferrari 488 GTB",
    description: "An officially licensed Ferrari 488 GTB in stunning die-cast form. Authentic livery, detailed interior, and rolling wheels make this a premium collectible.",
    price: 799,
    originalPrice: 999,
    images: ["https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=400"],
    category: "Licensed",
    brand: "Hot Wheels",
    series: "Ferrari Series",
    year: 2023,
    scale: "1:64",
    color: "Rosso Corsa Red",
    stockCount: 20,
    isFeatured: true,
    isNewArrival: false,
    rating: 4.9,
    numReviews: 67,
  },
  {
    name: "Hot Wheels Lamborghini Huracán",
    description: "The sleek lines of the Lamborghini Huracán are captured perfectly in this premium die-cast collectible. A showpiece for any car enthusiast.",
    price: 849,
    originalPrice: 999,
    images: ["https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400"],
    category: "Licensed",
    brand: "Hot Wheels",
    series: "Exotic Cars",
    year: 2024,
    scale: "1:64",
    color: "Arancio Argos Orange",
    stockCount: 18,
    isFeatured: true,
    isNewArrival: true,
    rating: 4.8,
    numReviews: 33,
  },
  {
    name: "Hot Wheels Dragon Blaster Monster Truck",
    description: "Crush the competition with this massive Monster Truck featuring fire-breathing dragon graphics and oversized wheels for maximum off-road action.",
    price: 599,
    originalPrice: 749,
    images: ["https://images.unsplash.com/photo-1555443805-658637491dd4?w=400"],
    category: "Monster Trucks",
    brand: "Hot Wheels",
    series: "Monster Trucks Live",
    year: 2023,
    scale: "1:24",
    color: "Dragon Red",
    stockCount: 35,
    isFeatured: false,
    isNewArrival: false,
    rating: 4.5,
    numReviews: 29,
  },
  {
    name: "Hot Wheels Super Treasure Hunt '70 Dodge Charger",
    description: "Extremely rare Super Treasure Hunt with spectraflame paint and Real Rider rubber tires. The Holy Grail for collectors - limited production numbers worldwide.",
    price: 2499,
    originalPrice: 0,
    images: ["https://images.unsplash.com/photo-1486496572940-2bb2341fdbdf?w=400"],
    category: "Super Treasure Hunt",
    brand: "Hot Wheels",
    series: "Super Treasure Hunt",
    year: 2024,
    scale: "1:64",
    color: "Spectraflame Gold",
    stockCount: 5,
    isFeatured: true,
    isNewArrival: true,
    rating: 5.0,
    numReviews: 8,
  },
  {
    name: "Hot Wheels Speed Racer Track Set",
    description: "Build epic racing circuits with this comprehensive track set. Includes loop-the-loops, gravity drops, and booster sections. Compatible with all 1:64 Hot Wheels cars.",
    price: 1299,
    originalPrice: 1599,
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"],
    category: "Track Sets",
    brand: "Hot Wheels",
    series: "Ultimate Tracks",
    year: 2023,
    scale: "1:64",
    color: "Orange",
    stockCount: 12,
    isFeatured: false,
    isNewArrival: false,
    rating: 4.7,
    numReviews: 41,
  },
  {
    name: "Hot Wheels Porsche 911 GT3",
    description: "The iconic Porsche 911 GT3 RS in pristine die-cast form. Authentic racing livery with detailed wheels and aerodynamic kit perfectly replicated.",
    price: 749,
    originalPrice: 899,
    images: ["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400"],
    category: "Licensed",
    brand: "Hot Wheels",
    series: "Porsche Series",
    year: 2024,
    scale: "1:64",
    color: "Guards Red",
    stockCount: 22,
    isFeatured: false,
    isNewArrival: true,
    rating: 4.8,
    numReviews: 19,
  },
  {
    name: "Hot Wheels McLaren P1",
    description: "The revolutionary McLaren P1 hybrid hypercar captured in stunning 1:64 scale. Features hybrid powertrain detailing and authentic race livery.",
    price: 699,
    originalPrice: 849,
    images: ["https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400"],
    category: "Licensed",
    brand: "Hot Wheels",
    series: "Hypercar Collection",
    year: 2024,
    scale: "1:64",
    color: "Ice Silver",
    stockCount: 16,
    isFeatured: false,
    isNewArrival: false,
    rating: 4.7,
    numReviews: 14,
  },
  {
    name: "Hot Wheels City Stunt Jump Set",
    description: "Perform death-defying stunts with this city-themed track set featuring a giant loop, jump ramp, and crash landing zone. Includes 2 exclusive cars.",
    price: 999,
    originalPrice: 1299,
    images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"],
    category: "Track Sets",
    brand: "Hot Wheels",
    series: "City Sets",
    year: 2023,
    scale: "1:64",
    color: "Multicolor",
    stockCount: 8,
    isFeatured: false,
    isNewArrival: false,
    rating: 4.4,
    numReviews: 22,
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@hotwheels.com',
      password: 'admin123',
      isAdmin: true,
    });

    // Create test user
    await User.create({
      name: 'John Racer',
      email: 'john@example.com',
      password: 'test123',
      isAdmin: false,
    });

    await Product.insertMany(products);

    console.log('✅ Data seeded successfully!');
    console.log('Admin: admin@hotwheels.com / admin123');
    console.log('User: john@example.com / test123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();
