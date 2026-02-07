import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ResendActivationDto } from './dto/resend-activation.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registros por minuto
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos de login por minuto
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('activate')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 intentos por minuto
  async activateAccount(@Body() activateAccountDto: ActivateAccountDto) {
    return this.authService.activateAccount(activateAccountDto.token);
  }

  @Post('resend-activation')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 intentos por minuto
  async resendActivation(@Body() resendActivationDto: ResendActivationDto) {
    return this.authService.resendActivationEmail(resendActivationDto.email);
  }

  @Post('validate')
  async validateUser(@Body('token') token: string) {
    return this.authService.validateUser(token);
  }
}
