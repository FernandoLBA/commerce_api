import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma';
import { NotificationsService } from '../notifications';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import {
  UserAlreadyExistsException,
  UserNotFoundException,
  InvalidCredentialsException,
  ActivationTokenInvalidException,
  ActivationTokenExpiredException,
  AccountAlreadyActiveException,
} from '../common';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Generate a secure random activation token
   */
  private generateActivationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get activation token expiration date (24 hours from now)
   */
  private getActivationExpiration(): Date {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 24);
    return expiration;
  }

  async register(createUserDto: CreateUserDto) {
    const { email, password, firstName, lastName } = createUserDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UserAlreadyExistsException();
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar token de activación
    const activationToken = this.generateActivationToken();
    const activationExpires = this.getActivationExpiration();

    // Crear nuevo usuario (isActive = false por defecto)
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isActive: false,
        emailVerified: false,
        activationToken,
        activationExpires,
      },
    });

    // Enviar email de activación
    await this.notificationsService.sendActivationEmail(
      email,
      activationToken,
      firstName || 'Usuario',
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      message: 'Registration successful. Please check your email to activate your account.',
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar el usuario
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    // Check if user is active
    if (!user.isActive) {
      throw new InvalidCredentialsException('Account not activated. Please check your email to activate your account.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // Generate JWT token with role
    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async validateUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Activate user account with activation token
   */
  async activateAccount(token: string) {
    // Find user with this activation token
    const user = await this.prisma.user.findUnique({
      where: { activationToken: token },
    });

    if (!user) {
      throw new ActivationTokenInvalidException();
    }

    // Check if already active
    if (user.isActive && user.emailVerified) {
      throw new AccountAlreadyActiveException();
    }

    // Check if token has expired
    if (user.activationExpires && user.activationExpires < new Date()) {
      throw new ActivationTokenExpiredException();
    }

    // Activate the account
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        emailVerified: true,
        activationToken: null,
        activationExpires: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return {
      message: 'Account activated successfully. You can now log in.',
      user: updatedUser,
    };
  }

  /**
   * Resend activation email
   */
  async resendActivationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    // Check if already active
    if (user.isActive && user.emailVerified) {
      throw new AccountAlreadyActiveException();
    }

    // Generate new activation token
    const activationToken = this.generateActivationToken();
    const activationExpires = this.getActivationExpiration();

    // Update user with new token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        activationToken,
        activationExpires,
      },
    });

    // Send new activation email
    await this.notificationsService.sendActivationEmail(
      email,
      activationToken,
      user.firstName || 'Usuario',
    );

    return {
      message: 'Activation email sent. Please check your inbox.',
    };
  }
}
