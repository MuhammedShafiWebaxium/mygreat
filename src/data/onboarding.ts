import type { Country, University } from '@/types'

export const COUNTRIES: Country[] = [
  { id: 'us', name: 'United States', flag: '🇺🇸', tagline: 'Ivy League & Silicon Valley', universities: 320, avgTuition: '$38k / yr', cities: ['New York', 'Boston', 'San Francisco'] },
  { id: 'uk', name: 'United Kingdom', flag: '🇬🇧', tagline: 'Centuries of academic prestige', universities: 160, avgTuition: '£24k / yr', cities: ['London', 'Edinburgh', 'Manchester'] },
  { id: 'ca', name: 'Canada', flag: '🇨🇦', tagline: 'Welcoming, safe & PR-friendly', universities: 98, avgTuition: 'CA$29k / yr', cities: ['Toronto', 'Vancouver', 'Montreal'] },
  { id: 'au', name: 'Australia', flag: '🇦🇺', tagline: 'Sunny campuses, strong research', universities: 43, avgTuition: 'A$33k / yr', cities: ['Sydney', 'Melbourne', 'Brisbane'] },
  { id: 'de', name: 'Germany', flag: '🇩🇪', tagline: 'World-class, almost tuition-free', universities: 108, avgTuition: '€500 / yr', cities: ['Munich', 'Berlin', 'Heidelberg'] },
  { id: 'ie', name: 'Ireland', flag: '🇮🇪', tagline: 'Europe’s tech gateway', universities: 28, avgTuition: '€18k / yr', cities: ['Dublin', 'Cork', 'Galway'] },
  { id: 'nz', name: 'New Zealand', flag: '🇳🇿', tagline: 'Adventure meets academia', universities: 8, avgTuition: 'NZ$27k / yr', cities: ['Auckland', 'Wellington'] },
  { id: 'nl', name: 'Netherlands', flag: '🇳🇱', tagline: '2,100+ English-taught programs', universities: 55, avgTuition: '€14k / yr', cities: ['Amsterdam', 'Delft', 'Utrecht'] },
  { id: 'fr', name: 'France', flag: '🇫🇷', tagline: 'Art, fashion & grandes écoles', universities: 83, avgTuition: '€10k / yr', cities: ['Paris', 'Lyon', 'Toulouse'] },
  { id: 'sg', name: 'Singapore', flag: '🇸🇬', tagline: 'Asia’s innovation hub', universities: 6, avgTuition: 'S$32k / yr', cities: ['Singapore'] },
]

export const UNIVERSITIES: University[] = [
  // United States
  { id: 'mit', name: 'MIT', city: 'Cambridge, MA', countryId: 'us', rank: 1, tuition: '$59,750', acceptance: '4%', knownFor: 'Engineering & CS' },
  { id: 'stanford', name: 'Stanford University', city: 'Stanford, CA', countryId: 'us', rank: 6, tuition: '$62,484', acceptance: '4%', knownFor: 'Entrepreneurship' },
  { id: 'harvard', name: 'Harvard University', city: 'Cambridge, MA', countryId: 'us', rank: 4, tuition: '$59,076', acceptance: '3%', knownFor: 'Law & Business' },
  { id: 'cmu', name: 'Carnegie Mellon', city: 'Pittsburgh, PA', countryId: 'us', rank: 52, tuition: '$63,829', acceptance: '11%', knownFor: 'Computer Science' },
  { id: 'nyu', name: 'New York University', city: 'New York, NY', countryId: 'us', rank: 38, tuition: '$60,438', acceptance: '12%', knownFor: 'Finance & Arts' },
  // United Kingdom
  { id: 'oxford', name: 'University of Oxford', city: 'Oxford', countryId: 'uk', rank: 3, tuition: '£33,050', acceptance: '14%', knownFor: 'Humanities & Sciences' },
  { id: 'cambridge', name: 'University of Cambridge', city: 'Cambridge', countryId: 'uk', rank: 2, tuition: '£35,000', acceptance: '18%', knownFor: 'Mathematics' },
  { id: 'imperial', name: 'Imperial College London', city: 'London', countryId: 'uk', rank: 6, tuition: '£37,900', acceptance: '14%', knownFor: 'Engineering' },
  { id: 'ucl', name: 'UCL', city: 'London', countryId: 'uk', rank: 9, tuition: '£31,200', acceptance: '30%', knownFor: 'Architecture' },
  { id: 'edinburgh', name: 'University of Edinburgh', city: 'Edinburgh', countryId: 'uk', rank: 22, tuition: '£28,950', acceptance: '33%', knownFor: 'Informatics' },
  // Canada
  { id: 'toronto', name: 'University of Toronto', city: 'Toronto', countryId: 'ca', rank: 21, tuition: 'CA$61,720', acceptance: '43%', knownFor: 'Research' },
  { id: 'mcgill', name: 'McGill University', city: 'Montreal', countryId: 'ca', rank: 30, tuition: 'CA$56,544', acceptance: '46%', knownFor: 'Medicine' },
  { id: 'ubc', name: 'University of British Columbia', city: 'Vancouver', countryId: 'ca', rank: 34, tuition: 'CA$58,000', acceptance: '52%', knownFor: 'Sustainability' },
  { id: 'waterloo', name: 'University of Waterloo', city: 'Waterloo', countryId: 'ca', rank: 112, tuition: 'CA$55,000', acceptance: '53%', knownFor: 'Co-op Programs' },
  // Australia
  { id: 'melbourne', name: 'University of Melbourne', city: 'Melbourne', countryId: 'au', rank: 14, tuition: 'A$45,000', acceptance: '70%', knownFor: 'Business' },
  { id: 'sydney', name: 'University of Sydney', city: 'Sydney', countryId: 'au', rank: 19, tuition: 'A$46,500', acceptance: '30%', knownFor: 'Law' },
  { id: 'anu', name: 'Australian National University', city: 'Canberra', countryId: 'au', rank: 34, tuition: 'A$44,000', acceptance: '35%', knownFor: 'Politics & Policy' },
  { id: 'unsw', name: 'UNSW Sydney', city: 'Sydney', countryId: 'au', rank: 19, tuition: 'A$44,500', acceptance: '30%', knownFor: 'Engineering' },
  // Germany
  { id: 'tum', name: 'TU Munich', city: 'Munich', countryId: 'de', rank: 37, tuition: '€276', acceptance: '8%', knownFor: 'Engineering' },
  { id: 'heidelberg', name: 'Heidelberg University', city: 'Heidelberg', countryId: 'de', rank: 65, tuition: '€350', acceptance: '16%', knownFor: 'Medicine' },
  { id: 'rwth', name: 'RWTH Aachen', city: 'Aachen', countryId: 'de', rank: 106, tuition: '€600', acceptance: '10%', knownFor: 'Mechanical Eng.' },
  { id: 'humboldt', name: 'Humboldt University', city: 'Berlin', countryId: 'de', rank: 120, tuition: '€620', acceptance: '18%', knownFor: 'Arts & Sciences' },
  // Ireland
  { id: 'trinity', name: 'Trinity College Dublin', city: 'Dublin', countryId: 'ie', rank: 81, tuition: '€21,080', acceptance: '33%', knownFor: 'Literature' },
  { id: 'ucd', name: 'University College Dublin', city: 'Dublin', countryId: 'ie', rank: 171, tuition: '€20,500', acceptance: '40%', knownFor: 'Business' },
  { id: 'ucg', name: 'University of Galway', city: 'Galway', countryId: 'ie', rank: 289, tuition: '€18,500', acceptance: '48%', knownFor: 'Marine Science' },
  // New Zealand
  { id: 'auckland', name: 'University of Auckland', city: 'Auckland', countryId: 'nz', rank: 68, tuition: 'NZ$42,000', acceptance: '45%', knownFor: 'Research' },
  { id: 'otago', name: 'University of Otago', city: 'Dunedin', countryId: 'nz', rank: 206, tuition: 'NZ$38,000', acceptance: '58%', knownFor: 'Health Sciences' },
  { id: 'vuw', name: 'Victoria University of Wellington', city: 'Wellington', countryId: 'nz', rank: 241, tuition: 'NZ$36,000', acceptance: '60%', knownFor: 'Design' },
  // Netherlands
  { id: 'tudelft', name: 'TU Delft', city: 'Delft', countryId: 'nl', rank: 61, tuition: '€16,700', acceptance: '42%', knownFor: 'Aerospace' },
  { id: 'uva', name: 'University of Amsterdam', city: 'Amsterdam', countryId: 'nl', rank: 53, tuition: '€14,500', acceptance: '39%', knownFor: 'Media Studies' },
  { id: 'erasmus', name: 'Erasmus University Rotterdam', city: 'Rotterdam', countryId: 'nl', rank: 176, tuition: '€15,200', acceptance: '35%', knownFor: 'Economics' },
  // France
  { id: 'sorbonne', name: 'Sorbonne University', city: 'Paris', countryId: 'fr', rank: 59, tuition: '€3,900', acceptance: '12%', knownFor: 'Arts & Letters' },
  { id: 'sciencespo', name: 'Sciences Po', city: 'Paris', countryId: 'fr', rank: 242, tuition: '€14,700', acceptance: '10%', knownFor: 'Political Science' },
  { id: 'hec', name: 'HEC Paris', city: 'Jouy-en-Josas', countryId: 'fr', rank: 999, tuition: '€53,000', acceptance: '8%', knownFor: 'MBA & Management' },
  // Singapore
  { id: 'nus', name: 'National University of Singapore', city: 'Singapore', countryId: 'sg', rank: 8, tuition: 'S$38,000', acceptance: '7%', knownFor: 'Engineering' },
  { id: 'ntu', name: 'Nanyang Technological University', city: 'Singapore', countryId: 'sg', rank: 26, tuition: 'S$36,800', acceptance: '25%', knownFor: 'AI & Robotics' },
  { id: 'smu', name: 'Singapore Management University', city: 'Singapore', countryId: 'sg', rank: 545, tuition: 'S$47,000', acceptance: '35%', knownFor: 'Business' },
]

export const EDUCATION_LEVELS = [
  { id: 'high-school', label: 'High School', desc: 'Completed or pursuing Grade 12' },
  { id: 'bachelors', label: "Bachelor's", desc: 'Undergraduate degree holder' },
  { id: 'masters', label: "Master's", desc: 'Postgraduate degree holder' },
]

export const DEGREES = ["Bachelor's", "Master's", 'MBA', 'PhD']

export const FIELDS = [
  'Computer Science', 'Engineering', 'Business & Management', 'Data Science & AI',
  'Medicine & Health', 'Law', 'Finance & Economics', 'Design & Arts',
  'Natural Sciences', 'Social Sciences', 'Hospitality & Tourism', 'Media & Communication',
]

export const GRAD_YEARS = ['2023', '2024', '2025', '2026', '2027', '2028']

export const ENGLISH_TESTS = ['Not taken yet', 'IELTS', 'TOEFL', 'PTE', 'Duolingo']

export const INTAKES = ['Fall 2026', 'Spring 2027', 'Fall 2027', 'Spring 2028']

export const MAX_UNIVERSITY_PICKS = 3

