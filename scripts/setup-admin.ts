import 'dotenv/config';
import {readFile} from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import {database,result} from '../src/server/db.ts';

// Supply the password through a private file, never a command-line argument.
const [email,passwordFile]=process.argv.slice(2);
if (!email || !passwordFile || !email.includes('@')) throw new Error('Usage: npm run admin:setup -- email@example.com path-to-private-password-file');
const password=(await readFile(passwordFile,'utf8')).trim();
if (password.length<14) throw new Error('Use a unique administrator password with at least 14 characters.');
const passwordHash=await bcrypt.hash(password,12);
await result(database().from('qbot_users').upsert({email:email.toLowerCase().trim(),password_hash:passwordHash,role:'admin',is_verified:true,two_factor_enabled:false},{onConflict:'email'}));
console.log('Administrator account saved. Sign in on the website. No customer license was issued.');
