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
  { id: 1, name: 'Margaret Johnson', email: 'mjohnson@email.com', phone: '(405) 555-0101', city: 'Oklahoma City', state: 'OK', dob: '1948-03-14', gender: 'F', education: "Bachelor's", enrolledCourses: ['GD-01', 'WM-02'] },
  { id: 2, name: 'Robert Williams', email: 'rwilliams@email.com', phone: '(405) 555-0102', city: 'Edmond', state: 'OK', dob: '1945-07-22', gender: 'M', education: "Master's", enrolledCourses: ['GD-01', 'HS-03'] },
  { id: 3, name: 'Patricia Davis', email: 'pdavis@email.com', phone: '(405) 555-0103', city: 'Oklahoma City', state: 'OK', dob: '1952-11-05', gender: 'F', education: 'Doctorate', enrolledCourses: ['WM-02', 'AR-04'] },
  { id: 4, name: 'Charles Brown', email: 'cbrown@email.com', phone: '(405) 555-0104', city: 'Midwest City', state: 'OK', dob: '1950-02-18', gender: 'M', education: "Bachelor's", enrolledCourses: ['GD-01'] },
  { id: 5, name: 'Linda Martinez', email: 'lmartinez@email.com', phone: '(405) 555-0105', city: 'Norman', state: 'OK', dob: '1955-09-30', gender: 'F', education: "Master's", enrolledCourses: ['HS-03', 'WM-02', 'MU-05'] },
  { id: 6, name: 'James Wilson', email: 'jwilson@email.com', phone: '(405) 555-0106', city: 'Yukon', state: 'OK', dob: '1947-12-08', gender: 'M', education: "Bachelor's", enrolledCourses: ['GD-01', 'AR-04'] },
  { id: 7, name: 'Barbara Anderson', email: 'banderson@email.com', phone: '(405) 555-0107', city: 'Oklahoma City', state: 'OK', dob: '1953-06-25', gender: 'F', education: 'Some College', enrolledCourses: ['MU-05', 'WM-02'] },
  { id: 8, name: 'William Taylor', email: 'wtaylor@email.com', phone: '(405) 555-0108', city: 'Edmond', state: 'OK', dob: '1949-04-12', gender: 'M', education: "Master's", enrolledCourses: ['GD-01', 'HS-03'] },
  { id: 9, name: 'Dorothy Thomas', email: 'dthomas@email.com', phone: '(405) 555-0109', city: 'Oklahoma City', state: 'OK', dob: '1956-08-17', gender: 'F', education: "Bachelor's", enrolledCourses: ['AR-04', 'WM-02'] },
  { id: 10, name: 'Richard Jackson', email: 'rjackson@email.com', phone: '(405) 555-0110', city: 'Moore', state: 'OK', dob: '1944-01-29', gender: 'M', education: 'High School', enrolledCourses: ['GD-01'] },
  { id: 11, name: 'Susan White', email: 'swhite@email.com', phone: '(405) 555-0111', city: 'Del City', state: 'OK', dob: '1958-05-03', gender: 'F', education: "Bachelor's", enrolledCourses: ['MU-05', 'HS-03'] },
  { id: 12, name: 'Joseph Harris', email: 'jharris@email.com', phone: '(405) 555-0112', city: 'Oklahoma City', state: 'OK', dob: '1951-10-14', gender: 'M', education: "Master's", enrolledCourses: ['GD-01', 'WM-02', 'AR-04'] },
  { id: 13, name: 'Nancy Clark', email: 'nclark@email.com', phone: '(405) 555-0113', city: 'Mustang', state: 'OK', dob: '1954-03-21', gender: 'F', education: "Bachelor's", enrolledCourses: ['HS-03'] },
  { id: 14, name: 'Thomas Lewis', email: 'tlewis@email.com', phone: '(405) 555-0114', city: 'Oklahoma City', state: 'OK', dob: '1946-07-09', gender: 'M', education: 'Doctorate', enrolledCourses: ['GD-01', 'MU-05'] },
  { id: 15, name: 'Karen Robinson', email: 'krobinson@email.com', phone: '(405) 555-0115', city: 'Edmond', state: 'OK', dob: '1960-12-16', gender: 'F', education: "Master's", enrolledCourses: ['WM-02', 'AR-04', 'MU-05'] },
];

export const courses: Course[] = [
  { id: 'GD-01', title: 'Great Decisions 2025', instructor: 'Dr. Helen Marsh', day: 'Tuesday', time: '6:00 PM – 8:00 PM', location: 'Hefner Arts Center, Rm 201', enrolled: 22, capacity: 30, semester: 'Fall 2025', category: 'Current Events', fee: 75 },
  { id: 'WM-02', title: 'Writing Memoirs & Life Stories', instructor: 'Prof. Sandra Cole', day: 'Wednesday', time: '10:00 AM – 12:00 PM', location: 'Hefner Arts Center, Rm 105', enrolled: 18, capacity: 25, semester: 'Fall 2025', category: 'Writing', fee: 85 },
  { id: 'HS-03', title: 'Oklahoma History & Culture', instructor: 'Dr. Frank Reed', day: 'Thursday', time: '1:00 PM – 3:00 PM', location: 'Library Conference Room', enrolled: 14, capacity: 20, semester: 'Fall 2025', category: 'History', fee: 65 },
  { id: 'AR-04', title: 'Watercolor Painting for Beginners', instructor: 'Ms. Julia Tanner', day: 'Monday', time: '9:00 AM – 11:30 AM', location: 'Arts Studio A', enrolled: 12, capacity: 16, semester: 'Fall 2025', category: 'Arts', fee: 120 },
  { id: 'MU-05', title: 'Music Appreciation & History', instructor: 'Prof. David Kim', day: 'Friday', time: '2:00 PM – 4:00 PM', location: 'Music Hall, Rm 3', enrolled: 20, capacity: 28, semester: 'Fall 2025', category: 'Music', fee: 70 },
  { id: 'TK-06', title: 'Technology for Everyday Life', instructor: 'Mr. Carl Brown', day: 'Tuesday', time: '10:00 AM – 12:00 PM', location: 'Computer Lab', enrolled: 16, capacity: 18, semester: 'Fall 2025', category: 'Technology', fee: 90 },
  { id: 'FN-07', title: 'Personal Finance & Retirement', instructor: 'Ms. Rachel Owens', day: 'Wednesday', time: '2:00 PM – 4:00 PM', location: 'Room 210', enrolled: 25, capacity: 30, semester: 'Fall 2025', category: 'Finance', fee: 60 },
  { id: 'HT-08', title: 'Health & Wellness: Body & Mind', instructor: 'Dr. Amy Nguyen', day: 'Thursday', time: '9:00 AM – 10:30 AM', location: 'Wellness Center', enrolled: 28, capacity: 35, semester: 'Fall 2025', category: 'Health', fee: 55 },
];

export const transactions: Transaction[] = [
  { date: '2025-07-03', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Credit Card', studentName: 'Margaret Johnson' },
  { date: '2025-07-03', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Cash', studentName: 'Robert Williams' },
  { date: '2025-07-05', description: 'Course registration – Writing Memoirs', category: 'Course Fee', amount: 85.00, paymentMethod: 'Credit Card', studentName: 'Patricia Davis' },
  { date: '2025-07-05', description: 'Course registration – Watercolor Painting', category: 'Course Fee', amount: 120.00, paymentMethod: 'Check', studentName: 'James Wilson' },
  { date: '2025-07-08', description: 'Course registration – Music Appreciation', category: 'Course Fee', amount: 70.00, paymentMethod: 'Credit Card', studentName: 'Barbara Anderson' },
  { date: '2025-07-10', description: 'Membership renewal – Annual', category: 'Membership', amount: 50.00, paymentMethod: 'Credit Card', studentName: 'Charles Brown' },
  { date: '2025-07-12', description: 'Course registration – Oklahoma History', category: 'Course Fee', amount: 65.00, paymentMethod: 'Credit Card', studentName: 'Linda Martinez' },
  { date: '2025-07-15', description: 'Course registration – Tech for Life', category: 'Course Fee', amount: 90.00, paymentMethod: 'Credit Card', studentName: 'William Taylor' },
  { date: '2025-07-15', description: 'Materials fee – Watercolor', category: 'Materials', amount: 35.00, paymentMethod: 'Cash', studentName: 'Dorothy Thomas' },
  { date: '2025-07-18', description: 'Course registration – Personal Finance', category: 'Course Fee', amount: 60.00, paymentMethod: 'Check', studentName: 'Richard Jackson' },
  { date: '2025-07-20', description: 'Course registration – Health & Wellness', category: 'Course Fee', amount: 55.00, paymentMethod: 'Credit Card', studentName: 'Susan White' },
  { date: '2025-07-22', description: 'Membership renewal – Annual', category: 'Membership', amount: 50.00, paymentMethod: 'Credit Card', studentName: 'Joseph Harris' },
  { date: '2025-07-25', description: 'Course registration – Great Decisions', category: 'Course Fee', amount: 75.00, paymentMethod: 'Credit Card', studentName: 'Nancy Clark' },
  { date: '2025-07-28', description: 'Course registration – Music Appreciation', category: 'Course Fee', amount: 70.00, paymentMethod: 'Cash', studentName: 'Thomas Lewis' },
  { date: '2025-08-01', description: 'Course registration – Writing Memoirs', category: 'Course Fee', amount: 85.00, paymentMethod: 'Credit Card', studentName: 'Karen Robinson' },
  { date: '2025-08-05', description: 'Donation – General Fund', category: 'Donation', amount: 200.00, paymentMethod: 'Check', studentName: 'Robert Williams' },
  { date: '2025-08-08', description: 'Course registration – Tech for Life', category: 'Course Fee', amount: 90.00, paymentMethod: 'Credit Card', studentName: 'Margaret Johnson' },
  { date: '2025-08-12', description: 'Materials fee – Watercolor', category: 'Materials', amount: 35.00, paymentMethod: 'Cash', studentName: 'Patricia Davis' },
  { date: '2025-08-15', description: 'Course registration – Health & Wellness', category: 'Course Fee', amount: 55.00, paymentMethod: 'Credit Card', studentName: 'Linda Martinez' },
  { date: '2025-08-20', description: 'Late registration fee', category: 'Fee', amount: 15.00, paymentMethod: 'Credit Card', studentName: 'Charles Brown' },
];
