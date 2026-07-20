// Sample dataset for demonstration. Every person, phone number, email address,
// and place below is fictional: phones use the reserved 555 prefix and emails
// use the reserved example.com domain.

export interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  dob: string;
  gender: 'F' | 'M';
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
}

export interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  paymentMethod: string;
  studentName: string;
}

export const students: Student[] = [
  { id: 1, name: 'Margaret Yates', email: 'myates@example.com', phone: '(555) 555-0101', city: 'Lakeside', state: 'OH', dob: '1947-03-24', gender: 'F', education: 'High School', enrolledCourses: ['WM-02', 'AR-04', 'MU-05'] },
  { id: 2, name: 'Margaret Carver', email: 'mcarver@example.com', phone: '(555) 555-0102', city: 'Lakeside', state: 'OH', dob: '1956-10-01', gender: 'F', education: "Bachelor's", enrolledCourses: ['WM-02', 'FN-07'] },
  { id: 3, name: 'Eugene Irving', email: 'eirving@example.com', phone: '(555) 555-0103', city: 'Greenville', state: 'OH', dob: '1945-12-14', gender: 'M', education: "Associate's", enrolledCourses: ['TK-06'] },
  { id: 4, name: 'Linda Mercer', email: 'lmercer@example.com', phone: '(555) 555-0104', city: 'Brookfield', state: 'OH', dob: '1951-10-09', gender: 'F', education: "Master's", enrolledCourses: ['GD-01', 'WM-02', 'AR-04'] },
  { id: 5, name: 'Ralph Lockwood', email: 'rlockwood@example.com', phone: '(555) 555-0105', city: 'Ashland', state: 'OH', dob: '1942-01-22', gender: 'M', education: 'Some College', enrolledCourses: ['WM-02', 'FN-07'] },
  { id: 6, name: 'Barbara Mercer', email: 'barbaramercer@example.com', phone: '(555) 555-0106', city: 'Cedar Falls', state: 'OH', dob: '1960-06-06', gender: 'F', education: "Associate's", enrolledCourses: ['MU-05'] },
  { id: 7, name: 'Elaine Underwood', email: 'eunderwood@example.com', phone: '(555) 555-0107', city: 'Milton', state: 'OH', dob: '1947-03-15', gender: 'F', education: "Associate's", enrolledCourses: ['HS-03', 'AR-04', 'TK-06'] },
  { id: 8, name: 'Karen Bellamy', email: 'kbellamy@example.com', phone: '(555) 555-0108', city: 'Cedar Falls', state: 'OH', dob: '1948-02-07', gender: 'F', education: 'Doctorate', enrolledCourses: ['WM-02', 'TK-06'] },
  { id: 9, name: 'Frank Underwood', email: 'funderwood@example.com', phone: '(555) 555-0109', city: 'Lakeside', state: 'OH', dob: '1948-03-08', gender: 'M', education: "Master's", enrolledCourses: ['MU-05', 'FN-07'] },
  { id: 10, name: 'Paul Hollis', email: 'phollis@example.com', phone: '(555) 555-0110', city: 'Milton', state: 'OH', dob: '1955-02-25', gender: 'M', education: 'High School', enrolledCourses: ['HS-03'] },
  { id: 11, name: 'Ralph Carver', email: 'rcarver@example.com', phone: '(555) 555-0111', city: 'Cedar Falls', state: 'OH', dob: '1959-08-17', gender: 'M', education: 'Some College', enrolledCourses: ['GD-01', 'TK-06'] },
  { id: 12, name: 'Gloria Irving', email: 'girving@example.com', phone: '(555) 555-0112', city: 'Fairview', state: 'OH', dob: '1949-07-06', gender: 'F', education: "Bachelor's", enrolledCourses: ['WM-02', 'MU-05', 'HT-08'] },
  { id: 13, name: 'Betty Underwood', email: 'bunderwood@example.com', phone: '(555) 555-0113', city: 'Milton', state: 'OH', dob: '1946-03-12', gender: 'F', education: "Master's", enrolledCourses: ['GD-01', 'MU-05'] },
  { id: 14, name: 'Walter Ashford', email: 'washford@example.com', phone: '(555) 555-0114', city: 'Brookfield', state: 'OH', dob: '1949-04-02', gender: 'M', education: 'Some College', enrolledCourses: ['GD-01', 'WM-02'] },
  { id: 15, name: 'James Rutledge', email: 'jrutledge@example.com', phone: '(555) 555-0115', city: 'Lakeside', state: 'OH', dob: '1961-08-18', gender: 'M', education: 'Some College', enrolledCourses: ['WM-02', 'FN-07'] },
  { id: 16, name: 'Betty Mercer', email: 'bettymercer@example.com', phone: '(555) 555-0116', city: 'Cedar Falls', state: 'OH', dob: '1956-08-04', gender: 'F', education: 'Some College', enrolledCourses: ['GD-01'] },
  { id: 17, name: 'Janet Hollis', email: 'jhollis@example.com', phone: '(555) 555-0117', city: 'Fairview', state: 'OH', dob: '1962-11-02', gender: 'F', education: 'Some College', enrolledCourses: ['GD-01', 'MU-05', 'TK-06'] },
  { id: 18, name: 'Helen Vernon', email: 'hvernon@example.com', phone: '(555) 555-0118', city: 'Lakeside', state: 'OH', dob: '1957-03-24', gender: 'F', education: 'Doctorate', enrolledCourses: ['WM-02', 'HT-08'] },
  { id: 19, name: 'Raymond Granger', email: 'rgranger@example.com', phone: '(555) 555-0119', city: 'Fairview', state: 'OH', dob: '1961-07-12', gender: 'M', education: "Bachelor's", enrolledCourses: ['GD-01', 'TK-06'] },
  { id: 20, name: 'Patricia Mercer', email: 'pmercer@example.com', phone: '(555) 555-0120', city: 'Greenville', state: 'OH', dob: '1943-04-07', gender: 'F', education: 'Some College', enrolledCourses: ['WM-02', 'FN-07'] },
  { id: 21, name: 'Harold Hollis', email: 'hhollis@example.com', phone: '(555) 555-0121', city: 'Cedar Falls', state: 'OH', dob: '1957-02-02', gender: 'M', education: "Bachelor's", enrolledCourses: ['GD-01', 'HT-08'] },
  { id: 22, name: 'Susan Newland', email: 'snewland@example.com', phone: '(555) 555-0122', city: 'Cedar Falls', state: 'OH', dob: '1946-07-02', gender: 'F', education: 'Some College', enrolledCourses: ['FN-07'] },
  { id: 23, name: 'Harold Jamison', email: 'hjamison@example.com', phone: '(555) 555-0123', city: 'Ashland', state: 'OH', dob: '1957-11-23', gender: 'M', education: "Bachelor's", enrolledCourses: ['AR-04'] },
  { id: 24, name: 'Janet Yates', email: 'jyates@example.com', phone: '(555) 555-0124', city: 'Fairview', state: 'OH', dob: '1950-01-02', gender: 'F', education: "Bachelor's", enrolledCourses: ['GD-01', 'HS-03'] },
  { id: 25, name: 'Susan Carver', email: 'scarver@example.com', phone: '(555) 555-0125', city: 'Ashland', state: 'OH', dob: '1947-07-04', gender: 'F', education: 'Doctorate', enrolledCourses: ['GD-01', 'MU-05'] },
  { id: 26, name: 'Joan Vernon', email: 'jvernon@example.com', phone: '(555) 555-0126', city: 'Brookfield', state: 'OH', dob: '1948-04-22', gender: 'F', education: "Master's", enrolledCourses: ['FN-07'] },
  { id: 27, name: 'Betty Ogden', email: 'bogden@example.com', phone: '(555) 555-0127', city: 'Greenville', state: 'OH', dob: '1942-01-15', gender: 'F', education: "Bachelor's", enrolledCourses: ['GD-01', 'WM-02'] },
  { id: 28, name: 'Marilyn Irving', email: 'mirving@example.com', phone: '(555) 555-0128', city: 'Brookfield', state: 'OH', dob: '1942-04-12', gender: 'F', education: "Associate's", enrolledCourses: ['MU-05', 'HT-08'] },
  { id: 29, name: 'Gloria Jamison', email: 'gjamison@example.com', phone: '(555) 555-0129', city: 'Lakeside', state: 'OH', dob: '1948-02-04', gender: 'F', education: "Master's", enrolledCourses: ['MU-05'] },
  { id: 30, name: 'Ruth Granger', email: 'ruthgranger@example.com', phone: '(555) 555-0130', city: 'Milton', state: 'OH', dob: '1955-05-28', gender: 'F', education: 'High School', enrolledCourses: ['GD-01', 'MU-05'] },
  { id: 31, name: 'Ruth Eastman', email: 'reastman@example.com', phone: '(555) 555-0131', city: 'Lakeside', state: 'OH', dob: '1954-09-23', gender: 'F', education: "Bachelor's", enrolledCourses: ['WM-02'] },
  { id: 32, name: 'Gloria Bellamy', email: 'gbellamy@example.com', phone: '(555) 555-0132', city: 'Milton', state: 'OH', dob: '1957-03-14', gender: 'F', education: 'Some College', enrolledCourses: ['GD-01', 'HS-03'] },
];

// Enrollment is derived from the student records so the dashboard, schedule,
// and rosters always agree.
const enrollmentFor = (courseId: string): number =>
  students.filter(s => s.enrolledCourses.includes(courseId)).length;

const courseCatalog: Omit<Course, 'enrolled'>[] = [
  { id: 'GD-01', title: 'Great Decisions 2025', instructor: 'Dr. Helen Marsh', day: 'Tuesday', time: '6:00 PM – 8:00 PM', location: 'Community Arts Center, Rm 201', capacity: 16, semester: 'Fall 2025', category: 'Current Events', fee: 75 },
  { id: 'WM-02', title: 'Writing Memoirs & Life Stories', instructor: 'Prof. Sandra Cole', day: 'Wednesday', time: '10:00 AM – 12:00 PM', location: 'Community Arts Center, Rm 105', capacity: 15, semester: 'Fall 2025', category: 'Writing', fee: 85 },
  { id: 'HS-03', title: 'Regional History & Culture', instructor: 'Dr. Frank Reed', day: 'Thursday', time: '1:00 PM – 3:00 PM', location: 'Library Conference Room', capacity: 12, semester: 'Fall 2025', category: 'History', fee: 65 },
  { id: 'AR-04', title: 'Watercolor Painting for Beginners', instructor: 'Ms. Julia Tanner', day: 'Monday', time: '9:00 AM – 11:30 AM', location: 'Arts Studio A', capacity: 10, semester: 'Fall 2025', category: 'Arts', fee: 120 },
  { id: 'MU-05', title: 'Music Appreciation & History', instructor: 'Prof. David Kim', day: 'Friday', time: '2:00 PM – 4:00 PM', location: 'Music Hall, Rm 3', capacity: 14, semester: 'Fall 2025', category: 'Music', fee: 70 },
  { id: 'TK-06', title: 'Technology for Everyday Life', instructor: 'Mr. Carl Brown', day: 'Tuesday', time: '10:00 AM – 12:00 PM', location: 'Computer Lab', capacity: 8, semester: 'Fall 2025', category: 'Technology', fee: 90 },
  { id: 'FN-07', title: 'Personal Finance & Retirement', instructor: 'Ms. Rachel Owens', day: 'Wednesday', time: '2:00 PM – 4:00 PM', location: 'Room 210', capacity: 12, semester: 'Fall 2025', category: 'Finance', fee: 60 },
  { id: 'HT-08', title: 'Health & Wellness: Body & Mind', instructor: 'Dr. Amy Nguyen', day: 'Thursday', time: '9:00 AM – 10:30 AM', location: 'Wellness Center', capacity: 12, semester: 'Fall 2025', category: 'Health', fee: 55 },
];

export const courses: Course[] = courseCatalog.map(c => ({
  ...c,
  enrolled: enrollmentFor(c.id),
}));

export const transactions: Transaction[] = [
  { date: '2025-07-02', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Credit Card', studentName: 'Linda Mercer' },
  { date: '2025-07-03', description: 'Course registration – Writing Memoirs', category: 'Course Fee', amount: 85.00, paymentMethod: 'Cash', studentName: 'Margaret Carver' },
  { date: '2025-07-04', description: 'Course registration – Writing Memoirs', category: 'Course Fee', amount: 85.00, paymentMethod: 'Credit Card', studentName: 'Gloria Irving' },
  { date: '2025-07-05', description: 'Course registration – Watercolor Painting', category: 'Course Fee', amount: 120.00, paymentMethod: 'Cash', studentName: 'Harold Jamison' },
  { date: '2025-07-05', description: 'Course registration – Writing Memoirs', category: 'Course Fee', amount: 85.00, paymentMethod: 'Credit Card', studentName: 'Margaret Yates' },
  { date: '2025-07-08', description: 'Course registration – Music Appreciation', category: 'Course Fee', amount: 70.00, paymentMethod: 'Credit Card', studentName: 'Frank Underwood' },
  { date: '2025-07-08', description: 'Course registration – Regional History', category: 'Course Fee', amount: 65.00, paymentMethod: 'Check', studentName: 'Elaine Underwood' },
  { date: '2025-07-10', description: 'Course registration – Regional History', category: 'Course Fee', amount: 65.00, paymentMethod: 'Credit Card', studentName: 'Paul Hollis' },
  { date: '2025-07-10', description: 'Membership renewal – Annual', category: 'Membership', amount: 50.00, paymentMethod: 'Credit Card', studentName: 'Walter Ashford' },
  { date: '2025-07-12', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Credit Card', studentName: 'Betty Underwood' },
  { date: '2025-07-12', description: 'Course registration – Tech for Life', category: 'Course Fee', amount: 90.00, paymentMethod: 'Credit Card', studentName: 'Eugene Irving' },
  { date: '2025-07-16', description: 'Course registration – Writing Memoirs', category: 'Course Fee', amount: 85.00, paymentMethod: 'Check', studentName: 'James Rutledge' },
  { date: '2025-07-17', description: 'Course registration – Personal Finance', category: 'Course Fee', amount: 60.00, paymentMethod: 'Credit Card', studentName: 'Susan Newland' },
  { date: '2025-07-19', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Credit Card', studentName: 'Ralph Carver' },
  { date: '2025-07-19', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Credit Card', studentName: 'Raymond Granger' },
  { date: '2025-07-19', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Credit Card', studentName: 'Walter Ashford' },
  { date: '2025-07-19', description: 'Course registration – Writing Memoirs', category: 'Course Fee', amount: 85.00, paymentMethod: 'Credit Card', studentName: 'Karen Bellamy' },
  { date: '2025-07-20', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Cash', studentName: 'Harold Hollis' },
  { date: '2025-07-22', description: 'Membership renewal – Annual', category: 'Membership', amount: 50.00, paymentMethod: 'Check', studentName: 'Gloria Jamison' },
  { date: '2025-07-23', description: 'Course registration – Writing Memoirs', category: 'Course Fee', amount: 85.00, paymentMethod: 'Check', studentName: 'Helen Vernon' },
  { date: '2025-08-02', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Cash', studentName: 'Janet Yates' },
  { date: '2025-08-02', description: 'Course registration – Music Appreciation', category: 'Course Fee', amount: 70.00, paymentMethod: 'Cash', studentName: 'Barbara Mercer' },
  { date: '2025-08-03', description: 'Course registration – Writing Memoirs', category: 'Course Fee', amount: 85.00, paymentMethod: 'Credit Card', studentName: 'Ralph Lockwood' },
  { date: '2025-08-05', description: 'Donation – General Fund', category: 'Donation', amount: 200.00, paymentMethod: 'Check', studentName: 'Helen Vernon' },
  { date: '2025-08-11', description: 'Course registration – Writing Memoirs', category: 'Course Fee', amount: 85.00, paymentMethod: 'Check', studentName: 'Patricia Mercer' },
  { date: '2025-08-12', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Credit Card', studentName: 'Janet Hollis' },
  { date: '2025-08-12', description: 'Materials fee – Watercolor', category: 'Materials', amount: 35.00, paymentMethod: 'Cash', studentName: 'Harold Jamison' },
  { date: '2025-08-14', description: 'Materials fee – Watercolor', category: 'Materials', amount: 35.00, paymentMethod: 'Cash', studentName: 'Elaine Underwood' },
  { date: '2025-08-20', description: 'Late registration fee', category: 'Fee', amount: 15.00, paymentMethod: 'Credit Card', studentName: 'Ruth Granger' },
  { date: '2025-08-25', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Credit Card', studentName: 'Betty Mercer' },
];
