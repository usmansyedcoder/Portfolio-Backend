const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Project = require('./models/Project');

dotenv.config();

const sampleProjects = [
  {
    title: 'E-Commerce Website',
    description: 'A full-stack e-commerce platform with user authentication, product catalog, shopping cart, and payment integration.',
    technologies: ['React', 'Node.js', 'MongoDB', 'Express', 'Stripe'],
    image: 'https://via.placeholder.com/400x250',
    githubLink: 'https://github.com/yourusername/ecommerce',
    liveLink: 'https://your-ecommerce-site.com'
  },
  {
    title: 'Social Media Dashboard',
    description: 'A responsive dashboard for managing social media accounts with analytics, post scheduling, and engagement tracking.',
    technologies: ['React', 'Redux', 'Node.js', 'MongoDB', 'Chart.js'],
    image: 'https://via.placeholder.com/400x250',
    githubLink: 'https://github.com/yourusername/social-dashboard',
    liveLink: 'https://your-dashboard.com'
  },
  {
    title: 'Task Management App',
    description: 'A collaborative task management application with real-time updates, team collaboration, and project tracking features.',
    technologies: ['React', 'Node.js', 'MongoDB', 'Socket.io', 'Express'],
    image: 'https://via.placeholder.com/400x250',
    githubLink: 'https://github.com/yourusername/task-manager',
    liveLink: 'https://your-task-app.com'
  },
  {
    title: 'Weather Forecast App',
    description: 'Real-time weather forecast application with location-based weather data, 7-day forecast, and interactive maps.',
    technologies: ['React', 'OpenWeather API', 'CSS3', 'Geolocation'],
    image: 'https://via.placeholder.com/400x250',
    githubLink: 'https://github.com/yourusername/weather-app',
    liveLink: 'https://your-weather-app.com'
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected');

    // Clear existing projects
    await Project.deleteMany({});
    console.log('Existing projects cleared');

    // Insert sample projects
    await Project.insertMany(sampleProjects);
    console.log('Sample projects added successfully');

    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
