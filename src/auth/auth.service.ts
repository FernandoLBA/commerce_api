import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import {
  UserAlreadyExistsException,
  UserNotFoundException,
  InvalidCredentialsException,
} from '../common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, password, firstName, lastName } = createUserDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new UserAlreadyExistsException();
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    await this.usersRepository.save(user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar el usuario
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // Generar token JWT
    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async validateUser(id: string) {
    return this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName'],
    });
  }
}
