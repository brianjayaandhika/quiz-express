import jwt from 'jsonwebtoken';

export function generateAuthToken(username, role) {
  return 'Bearer ' + jwt.sign({ username, role }, 'secret', { expiresIn: '2h' });
}
