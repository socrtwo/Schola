// All student, instructor, and location names below are fictional
// placeholders for demo purposes. Any resemblance to actual persons,
// living or dead, is unintentional.

export type OfferingFormat = 'course' | 'lecture' | 'workshop' | 'performance';

export interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  dob: string;
  gender: string;
  education: string;
  enrolledCourses: string[];
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  day: string;
  time: string;
  location: string;
  enrolled: number;
  capacity: number;
  semester: string;
  category: string;
  fee: number;
  doorPrice: number;
  description: string;
  imageUrl?: string;
  format: OfferingFormat;
  weeks: number;
  startDate: string;
}

export interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
  studentName: string;
}

export interface RosterEntry {
  courseId: string;
  studentName: string;
  email: string;
  phone: string;
  paid: boolean;
  attended: boolean[];
}

export interface Attachment {
  id: string;
  courseId: string;
  name: string;
  type: string;
  size: number;
  createdAt: number;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface ReminderLog {
  id: string;
  weekStart: string;
  courseIds: string[];
  recipientCount: number;
  sentAt: number;
  channel: 'email' | 'sms' | 'both';
}

export const students: Student[] = [
  { id: 1,  name: 'Robin Alder',       email: 'robin.a@example.com',    phone: '(555) 010-0101', city: 'Rivertown',  state: 'OK', dob: '1948-03-14', gender: 'F', education: "Bachelor's",    enrolledCourses: ['GD-01', 'WM-02'] },
  { id: 2,  name: 'Jordan Birch',      email: 'jordan.b@example.com',   phone: '(555) 010-0102', city: 'Eastfield',  state: 'OK', dob: '1945-07-22', gender: 'M', education: "Master's",      enrolledCourses: ['GD-01', 'HS-03'] },
  { id: 3,  name: 'Casey Cedar',       email: 'casey.c@example.com',    phone: '(555) 010-0103', city: 'Rivertown',  state: 'OK', dob: '1952-11-05', gender: 'F', education: 'Doctorate',     enrolledCourses: ['WM-02', 'AR-04'] },
  { id: 4,  name: 'Sage Elm',          email: 'sage.e@example.com',     phone: '(555) 010-0104', city: 'Midville',   state: 'OK', dob: '1950-02-18', gender: 'M', education: "Bachelor's",    enrolledCourses: ['GD-01'] },
  { id: 5,  name: 'Rowan Fern',        email: 'rowan.f@example.com',    phone: '(555) 010-0105', city: 'Northshire', state: 'OK', dob: '1955-09-30', gender: 'F', education: "Master's",      enrolledCourses: ['HS-03', 'WM-02', 'MU-05'] },
  { id: 6,  name: 'Taylor Grove',      email: 'taylor.g@example.com',   phone: '(555) 010-0106', city: 'Yarrow',     state: 'OK', dob: '1947-12-08', gender: 'M', education: "Bachelor's",    enrolledCourses: ['GD-01', 'AR-04'] },
  { id: 7,  name: 'Morgan Hawthorn',   email: 'morgan.h@example.com',   phone: '(555) 010-0107', city: 'Rivertown',  state: 'OK', dob: '1953-06-25', gender: 'F', education: 'Some College',  enrolledCourses: ['MU-05', 'WM-02'] },
  { id: 8,  name: 'Quinn Ivy',         email: 'quinn.i@example.com',    phone: '(555) 010-0108', city: 'Eastfield',  state: 'OK', dob: '1949-04-12', gender: 'M', education: "Master's",      enrolledCourses: ['GD-01', 'HS-03'] },
  { id: 9,  name: 'Avery Juniper',     email: 'avery.j@example.com',    phone: '(555) 010-0109', city: 'Rivertown',  state: 'OK', dob: '1956-08-17', gender: 'F', education: "Bachelor's",    enrolledCourses: ['AR-04', 'WM-02'] },
  { id: 10, name: 'Skyler Linden',     email: 'skyler.l@example.com',   phone: '(555) 010-0110', city: 'Mooreton',   state: 'OK', dob: '1944-01-29', gender: 'M', education: 'High School',   enrolledCourses: ['GD-01'] },
  { id: 11, name: 'Hayden Magnolia',   email: 'hayden.m@example.com',   phone: '(555) 010-0111', city: 'Delmar',     state: 'OK', dob: '1958-05-03', gender: 'F', education: "Bachelor's",    enrolledCourses: ['MU-05', 'HS-03'] },
  { id: 12, name: 'Parker Oakley',     email: 'parker.o@example.com',   phone: '(555) 010-0112', city: 'Rivertown',  state: 'OK', dob: '1951-10-14', gender: 'M', education: "Master's",      enrolledCourses: ['GD-01', 'WM-02', 'AR-04'] },
  { id: 13, name: 'Drew Pinehurst',    email: 'drew.p@example.com',     phone: '(555) 010-0113', city: 'Mustanton',  state: 'OK', dob: '1954-03-21', gender: 'F', education: "Bachelor's",    enrolledCourses: ['HS-03'] },
  { id: 14, name: 'River Quince',      email: 'river.q@example.com',    phone: '(555) 010-0114', city: 'Rivertown',  state: 'OK', dob: '1946-07-09', gender: 'M', education: 'Doctorate',     enrolledCourses: ['GD-01', 'MU-05'] },
  { id: 15, name: 'Emerson Rowan',     email: 'emerson.r@example.com',  phone: '(555) 010-0115', city: 'Eastfield',  state: 'OK', dob: '1960-12-16', gender: 'F', education: "Master's",      enrolledCourses: ['WM-02', 'AR-04', 'MU-05'] },
];

export const courses: Course[] = [
  {
    id: 'GD-01',
    title: 'Great Decisions 2025',
    instructor: 'Dr. A. Rowan',
    day: 'Tuesday',
    time: '6:00 PM – 8:00 PM',
    location: 'Main Campus, Arts Hall Rm 201',
    enrolled: 22, capacity: 30,
    semester: 'Fall 2025',
    category: 'Current Events',
    fee: 75, doorPrice: 15,
    format: 'course',
    weeks: 8,
    startDate: '2025-09-02',
    description:
      'A guided weekly discussion of eight urgent issues in U.S. foreign policy. ' +
      'Each session opens with a short briefing, then an open seminar. ' +
      'Bring your curiosity — no prior background required.',
    imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=70',
  },
  {
    id: 'WM-02',
    title: 'Writing Memoirs & Life Stories',
    instructor: 'Prof. B. Holly',
    day: 'Wednesday',
    time: '10:00 AM – 12:00 PM',
    location: 'Main Campus, Arts Hall Rm 105',
    enrolled: 18, capacity: 25,
    semester: 'Fall 2025',
    category: 'Writing',
    fee: 85, doorPrice: 15,
    format: 'workshop',
    weeks: 10,
    startDate: '2025-09-03',
    description:
      'Turn the stories you carry into pages you can share. Weekly prompts, gentle ' +
      'in-class reading, and one-on-one feedback from our instructor help you shape ' +
      'a polished memoir chapter by the end of term.',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&q=70',
  },
  {
    id: 'HS-03',
    title: 'Regional History & Culture',
    instructor: 'Dr. C. Sycamore',
    day: 'Thursday',
    time: '1:00 PM – 3:00 PM',
    location: 'Library Conference Room',
    enrolled: 14, capacity: 20,
    semester: 'Fall 2025',
    category: 'History',
    fee: 65, doorPrice: 12,
    format: 'lecture',
    weeks: 8,
    startDate: '2025-09-04',
    description:
      'An illustrated lecture series on the people, places, and turning points that ' +
      'shaped our region — from early settlement to the twentieth century. Short ' +
      'film clips and archival photographs accompany each talk.',
    imageUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&q=70',
  },
  {
    id: 'AR-04',
    title: 'Watercolor Painting for Beginners',
    instructor: 'Ms. D. Willow',
    day: 'Monday',
    time: '9:00 AM – 11:30 AM',
    location: 'Arts Studio A',
    enrolled: 12, capacity: 16,
    semester: 'Fall 2025',
    category: 'Arts',
    fee: 120, doorPrice: 25,
    format: 'workshop',
    weeks: 8,
    startDate: '2025-09-01',
    description:
      'A hands-on studio course for first-time painters. Learn brush control, simple ' +
      'color theory, and wet-on-wet techniques. All materials supplied on the first ' +
      'day; take home a finished piece each week.',
    imageUrl: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=1200&q=70',
  },
  {
    id: 'MU-05',
    title: 'Music Appreciation & History',
    instructor: 'Prof. E. Maple',
    day: 'Friday',
    time: '2:00 PM – 4:00 PM',
    location: 'Music Hall, Rm 3',
    enrolled: 20, capacity: 28,
    semester: 'Fall 2025',
    category: 'Music',
    fee: 70, doorPrice: 12,
    format: 'performance',
    weeks: 10,
    startDate: '2025-09-05',
    description:
      'A friendly tour through four centuries of Western classical music, with live ' +
      'student performances and recorded excerpts at each session. Guest ensembles ' +
      'join us twice during the term.',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&q=70',
  },
  {
    id: 'TK-06',
    title: 'Technology for Everyday Life',
    instructor: 'Mr. F. Pine',
    day: 'Tuesday',
    time: '10:00 AM – 12:00 PM',
    location: 'Computer Lab',
    enrolled: 16, capacity: 18,
    semester: 'Fall 2025',
    category: 'Technology',
    fee: 90, doorPrice: 15,
    format: 'course',
    weeks: 6,
    startDate: '2025-09-02',
    description:
      'Confidence with the devices you already own. Smartphones, tablets, email, ' +
      'video calls, and safe shopping online — at a comfortable pace, with patient ' +
      'guidance and plenty of time for questions.',
    imageUrl: 'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=1200&q=70',
  },
  {
    id: 'FN-07',
    title: 'Personal Finance & Retirement',
    instructor: 'Ms. G. Aspen',
    day: 'Wednesday',
    time: '2:00 PM – 4:00 PM',
    location: 'Room 210',
    enrolled: 25, capacity: 30,
    semester: 'Fall 2025',
    category: 'Finance',
    fee: 60, doorPrice: 10,
    format: 'lecture',
    weeks: 6,
    startDate: '2025-09-03',
    description:
      'Plain-language lectures on the questions that matter most in retirement: ' +
      'Social Security timing, drawdown strategies, estate basics, and avoiding ' +
      'common scams. No product pitches — education only.',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=70',
  },
  {
    id: 'HT-08',
    title: 'Health & Wellness: Body & Mind',
    instructor: 'Dr. H. Birchwood',
    day: 'Thursday',
    time: '9:00 AM – 10:30 AM',
    location: 'Wellness Center',
    enrolled: 28, capacity: 35,
    semester: 'Fall 2025',
    category: 'Health',
    fee: 55, doorPrice: 10,
    format: 'workshop',
    weeks: 8,
    startDate: '2025-09-04',
    description:
      'Gentle movement, balance work, and weekly conversations on sleep, nutrition, ' +
      'and stress. Suitable for all mobility levels — chairs provided and every ' +
      'exercise has a seated option.',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=70',
  },
];

export const transactions: Transaction[] = [
  { date: '2025-07-03', description: 'Course registration – Great Decisions',   category: 'Course Fee', amount: 75.00,  paymentMethod: 'Credit Card', studentName: 'Robin Alder' },
  { date: '2025-07-03', description: 'Course registration – Great Decisions',   category: 'Course Fee', amount: 75.00,  paymentMethod: 'Cash',        studentName: 'Jordan Birch' },
  { date: '2025-07-05', description: 'Course registration – Writing Memoirs',   category: 'Course Fee', amount: 85.00,  paymentMethod: 'Credit Card', studentName: 'Casey Cedar' },
  { date: '2025-07-05', description: 'Course registration – Watercolor',        category: 'Course Fee', amount: 120.00, paymentMethod: 'Check',       studentName: 'Taylor Grove' },
  { date: '2025-07-08', description: 'Course registration – Music Appreciation',category: 'Course Fee', amount: 70.00,  paymentMethod: 'Credit Card', studentName: 'Morgan Hawthorn' },
  { date: '2025-07-10', description: 'Membership renewal – Annual',             category: 'Membership', amount: 50.00,  paymentMethod: 'Credit Card', studentName: 'Sage Elm' },
  { date: '2025-07-12', description: 'Course registration – Regional History',  category: 'Course Fee', amount: 65.00,  paymentMethod: 'Credit Card', studentName: 'Rowan Fern' },
  { date: '2025-07-15', description: 'Course registration – Tech for Life',     category: 'Course Fee', amount: 90.00,  paymentMethod: 'Credit Card', studentName: 'Quinn Ivy' },
  { date: '2025-07-15', description: 'Materials fee – Watercolor',              category: 'Materials',  amount: 35.00,  paymentMethod: 'Cash',        studentName: 'Avery Juniper' },
  { date: '2025-07-18', description: 'Course registration – Personal Finance',  category: 'Course Fee', amount: 60.00,  paymentMethod: 'Check',       studentName: 'Skyler Linden' },
  { date: '2025-07-20', description: 'Course registration – Health & Wellness', category: 'Course Fee', amount: 55.00,  paymentMethod: 'Credit Card', studentName: 'Hayden Magnolia' },
  { date: '2025-07-22', description: 'Membership renewal – Annual',             category: 'Membership', amount: 50.00,  paymentMethod: 'Credit Card', studentName: 'Parker Oakley' },
  { date: '2025-07-25', description: 'Course registration – Great Decisions',   category: 'Course Fee', amount: 75.00,  paymentMethod: 'Credit Card', studentName: 'Drew Pinehurst' },
  { date: '2025-07-28', description: 'Course registration – Music Appreciation',category: 'Course Fee', amount: 70.00,  paymentMethod: 'Cash',        studentName: 'River Quince' },
  { date: '2025-08-01', description: 'Course registration – Writing Memoirs',   category: 'Course Fee', amount: 85.00,  paymentMethod: 'Credit Card', studentName: 'Emerson Rowan' },
  { date: '2025-08-05', description: 'Donation – General Fund',                 category: 'Donation',   amount: 200.00, paymentMethod: 'Check',       studentName: 'Jordan Birch' },
  { date: '2025-08-08', description: 'Course registration – Tech for Life',     category: 'Course Fee', amount: 90.00,  paymentMethod: 'Credit Card', studentName: 'Robin Alder' },
  { date: '2025-08-12', description: 'Materials fee – Watercolor',              category: 'Materials',  amount: 35.00,  paymentMethod: 'Cash',        studentName: 'Casey Cedar' },
  { date: '2025-08-15', description: 'Course registration – Health & Wellness', category: 'Course Fee', amount: 55.00,  paymentMethod: 'Credit Card', studentName: 'Rowan Fern' },
  { date: '2025-08-20', description: 'Late registration fee',                   category: 'Fee',        amount: 15.00,  paymentMethod: 'Credit Card', studentName: 'Sage Elm' },
];
