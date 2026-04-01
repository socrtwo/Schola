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

export const students: Student[] = [
  { id: 1, name: 'Eleanor Whitfield', email: 'ewhitfield@example.com', phone: '(555) 100-0201', city: 'Maplewood', state: 'IL', dob: '1948-03-14', gender: 'F', education: "Bachelor's", enrolledCourses: ['GD-01', 'WM-02'] },
  { id: 2, name: 'Harold Pendleton', email: 'hpendleton@example.com', phone: '(555) 100-0202', city: 'Cedar Falls', state: 'IL', dob: '1945-07-22', gender: 'M', education: "Master's", enrolledCourses: ['GD-01', 'HS-03'] },
  { id: 3, name: 'Vivian Holloway', email: 'vholloway@example.com', phone: '(555) 100-0203', city: 'Maplewood', state: 'IL', dob: '1952-11-05', gender: 'F', education: 'Doctorate', enrolledCourses: ['WM-02', 'AR-04'] },
  { id: 4, name: 'Chester Dunlap', email: 'cdunlap@example.com', phone: '(555) 100-0204', city: 'Briarwood', state: 'IL', dob: '1950-02-18', gender: 'M', education: "Bachelor's", enrolledCourses: ['GD-01'] },
  { id: 5, name: 'Rosalind Kemp', email: 'rkemp@example.com', phone: '(555) 100-0205', city: 'Willowbrook', state: 'IL', dob: '1955-09-30', gender: 'F', education: "Master's", enrolledCourses: ['HS-03', 'WM-02', 'MU-05'] },
  { id: 6, name: 'Franklin Beckett', email: 'fbeckett@example.com', phone: '(555) 100-0206', city: 'Stonebridge', state: 'IL', dob: '1947-12-08', gender: 'M', education: "Bachelor's", enrolledCourses: ['GD-01', 'AR-04'] },
  { id: 7, name: 'Irene Calloway', email: 'icalloway@example.com', phone: '(555) 100-0207', city: 'Maplewood', state: 'IL', dob: '1953-06-25', gender: 'F', education: 'Some College', enrolledCourses: ['MU-05', 'WM-02'] },
  { id: 8, name: 'Theodore Ashford', email: 'tashford@example.com', phone: '(555) 100-0208', city: 'Cedar Falls', state: 'IL', dob: '1949-04-12', gender: 'M', education: "Master's", enrolledCourses: ['GD-01', 'HS-03'] },
  { id: 9, name: 'Beatrice Sutton', email: 'bsutton@example.com', phone: '(555) 100-0209', city: 'Maplewood', state: 'IL', dob: '1956-08-17', gender: 'F', education: "Bachelor's", enrolledCourses: ['AR-04', 'WM-02'] },
  { id: 10, name: 'Clifford Ramsey', email: 'cramsey@example.com', phone: '(555) 100-0210', city: 'Ridgemont', state: 'IL', dob: '1944-01-29', gender: 'M', education: 'High School', enrolledCourses: ['GD-01'] },
  { id: 11, name: 'Lorraine Pemberton', email: 'lpemberton@example.com', phone: '(555) 100-0211', city: 'Fairview', state: 'IL', dob: '1958-05-03', gender: 'F', education: "Bachelor's", enrolledCourses: ['MU-05', 'HS-03'] },
  { id: 12, name: 'Wallace Thornton', email: 'wthornton@example.com', phone: '(555) 100-0212', city: 'Maplewood', state: 'IL', dob: '1951-10-14', gender: 'M', education: "Master's", enrolledCourses: ['GD-01', 'WM-02', 'AR-04'] },
  { id: 13, name: 'Constance Whitaker', email: 'cwhitaker@example.com', phone: '(555) 100-0213', city: 'Brookdale', state: 'IL', dob: '1954-03-21', gender: 'F', education: "Bachelor's", enrolledCourses: ['HS-03'] },
  { id: 14, name: 'Gilbert Norwood', email: 'gnorwood@example.com', phone: '(555) 100-0214', city: 'Maplewood', state: 'IL', dob: '1946-07-09', gender: 'M', education: 'Doctorate', enrolledCourses: ['GD-01', 'MU-05'] },
  { id: 15, name: 'Miriam Hartwell', email: 'mhartwell@example.com', phone: '(555) 100-0215', city: 'Cedar Falls', state: 'IL', dob: '1960-12-16', gender: 'F', education: "Master's", enrolledCourses: ['WM-02', 'AR-04', 'MU-05'] },
];

export const courses: Course[] = [
  { id: 'GD-01', title: 'Great Decisions 2025', instructor: 'Dr. Helena Cranston', day: 'Tuesday', time: '6:00 PM – 8:00 PM', location: 'Arts Center, Rm 201', enrolled: 22, capacity: 30, semester: 'Fall 2025', category: 'Current Events', fee: 75 },
  { id: 'WM-02', title: 'Writing Memoirs & Life Stories', instructor: 'Prof. Sandra Ellsworth', day: 'Wednesday', time: '10:00 AM – 12:00 PM', location: 'Arts Center, Rm 105', enrolled: 18, capacity: 25, semester: 'Fall 2025', category: 'Writing', fee: 85 },
  { id: 'HS-03', title: 'Regional History & Culture', instructor: 'Dr. Frank Shelbourne', day: 'Thursday', time: '1:00 PM – 3:00 PM', location: 'Library Conference Room', enrolled: 14, capacity: 20, semester: 'Fall 2025', category: 'History', fee: 65 },
  { id: 'AR-04', title: 'Watercolor Painting for Beginners', instructor: 'Ms. Julia Prescott', day: 'Monday', time: '9:00 AM – 11:30 AM', location: 'Arts Studio A', enrolled: 12, capacity: 16, semester: 'Fall 2025', category: 'Arts', fee: 120 },
  { id: 'MU-05', title: 'Music Appreciation & History', instructor: 'Prof. Daniel Kingsley', day: 'Friday', time: '2:00 PM – 4:00 PM', location: 'Music Hall, Rm 3', enrolled: 20, capacity: 28, semester: 'Fall 2025', category: 'Music', fee: 70 },
  { id: 'TK-06', title: 'Technology for Everyday Life', instructor: 'Mr. Carl Whitmore', day: 'Tuesday', time: '10:00 AM – 12:00 PM', location: 'Computer Lab', enrolled: 16, capacity: 18, semester: 'Fall 2025', category: 'Technology', fee: 90 },
  { id: 'FN-07', title: 'Personal Finance & Retirement', instructor: 'Ms. Rachel Fairbanks', day: 'Wednesday', time: '2:00 PM – 4:00 PM', location: 'Room 210', enrolled: 25, capacity: 30, semester: 'Fall 2025', category: 'Finance', fee: 60 },
  { id: 'HT-08', title: 'Health & Wellness: Body & Mind', instructor: 'Dr. Amy Langford', day: 'Thursday', time: '9:00 AM – 10:30 AM', location: 'Wellness Center', enrolled: 28, capacity: 35, semester: 'Fall 2025', category: 'Health', fee: 55 },
];

export const transactions: Transaction[] = [
  { date: '2025-07-03', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Credit Card', studentName: 'Eleanor Whitfield' },
  { date: '2025-07-03', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Cash', studentName: 'Harold Pendleton' },
  { date: '2025-07-05', description: 'Course registration – Writing Memoirs', category: 'Course Fee', amount: 85.00, paymentMethod: 'Credit Card', studentName: 'Vivian Holloway' },
  { date: '2025-07-05', description: 'Course registration – Watercolor Painting', category: 'Course Fee', amount: 120.00, paymentMethod: 'Check', studentName: 'Franklin Beckett' },
  { date: '2025-07-08', description: 'Course registration – Music Appreciation', category: 'Course Fee', amount: 70.00, paymentMethod: 'Credit Card', studentName: 'Irene Calloway' },
  { date: '2025-07-10', description: 'Membership renewal – Annual', category: 'Membership', amount: 50.00, paymentMethod: 'Credit Card', studentName: 'Chester Dunlap' },
  { date: '2025-07-12', description: 'Course registration – Regional History', category: 'Course Fee', amount: 65.00, paymentMethod: 'Credit Card', studentName: 'Rosalind Kemp' },
  { date: '2025-07-15', description: 'Course registration – Tech for Life', category: 'Course Fee', amount: 90.00, paymentMethod: 'Credit Card', studentName: 'Theodore Ashford' },
  { date: '2025-07-15', description: 'Materials fee – Watercolor', category: 'Materials', amount: 35.00, paymentMethod: 'Cash', studentName: 'Beatrice Sutton' },
  { date: '2025-07-18', description: 'Course registration – Personal Finance', category: 'Course Fee', amount: 60.00, paymentMethod: 'Check', studentName: 'Clifford Ramsey' },
  { date: '2025-07-20', description: 'Course registration – Health & Wellness', category: 'Course Fee', amount: 55.00, paymentMethod: 'Credit Card', studentName: 'Lorraine Pemberton' },
  { date: '2025-07-22', description: 'Membership renewal – Annual', category: 'Membership', amount: 50.00, paymentMethod: 'Credit Card', studentName: 'Wallace Thornton' },
  { date: '2025-07-25', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Credit Card', studentName: 'Constance Whitaker' },
  { date: '2025-07-28', description: 'Course registration – Music Appreciation', category: 'Course Fee', amount: 70.00, paymentMethod: 'Cash', studentName: 'Gilbert Norwood' },
  { date: '2025-08-01', description: 'Course registration – Writing Memoirs', category: 'Course Fee', amount: 85.00, paymentMethod: 'Credit Card', studentName: 'Miriam Hartwell' },
  { date: '2025-08-05', description: 'Donation – General Fund', category: 'Donation', amount: 200.00, paymentMethod: 'Check', studentName: 'Harold Pendleton' },
  { date: '2025-08-08', description: 'Course registration – Tech for Life', category: 'Course Fee', amount: 90.00, paymentMethod: 'Credit Card', studentName: 'Eleanor Whitfield' },
  { date: '2025-08-12', description: 'Materials fee – Watercolor', category: 'Materials', amount: 35.00, paymentMethod: 'Cash', studentName: 'Vivian Holloway' },
  { date: '2025-08-15', description: 'Course registration – Health & Wellness', category: 'Course Fee', amount: 55.00, paymentMethod: 'Credit Card', studentName: 'Rosalind Kemp' },
  { date: '2025-08-20', description: 'Late registration fee', category: 'Fee', amount: 15.00, paymentMethod: 'Credit Card', studentName: 'Chester Dunlap' },
];
