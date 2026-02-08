import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptService {
  static bcryptSaltRounds = 10;

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BcryptService.bcryptSaltRounds);
  }

  comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
