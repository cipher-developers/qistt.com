import bcryptjs from 'bcryptjs';

const password = 'admin123';
const hash = bcryptjs.hashSync(password, 12);
console.log('Hash for admin123:', hash);
