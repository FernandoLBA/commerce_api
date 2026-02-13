import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JWT_CONSTANTS } from '../../common/constants/jwt.constants';

/**
 * Estrategia JWT para validar tokens Bearer en las solicitudes HTTP.
 * Valida que el token sea válido y que el usuario exista en la base de datos.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: JWT_CONSTANTS.IGNORE_EXPIRATION,
      secretOrKey: JWT_CONSTANTS.SECRET,
    });
  }

  /**
   * Valida el payload del token JWT.
   * @param payload - Payload decodificado del token JWT
   * @returns Datos del usuario validado
   * @throws UnauthorizedException si el usuario no existe
   */
  async validate(payload: JwtPayload) {
    // try {
      const user = await this.authService.validateUser(payload.id);
      if (!user) {
        this.logger.warn(
          `Attempted access with non-existent user: ${payload.id}`,
        );
        throw new UnauthorizedException('User not authenticated');
      }

      if(!user.emailVerified) {
        this.logger.warn(
          `Attempted access with inactive user: ${payload.id}`,
        );
        throw new UnauthorizedException('User account is inactive');
      }
      // Log to see what validate returns
      return user;
    // } catch (error) {
    //   this.logger.error(
    //     `Error validating JWT payload for user ${payload.id}:`,
    //     error,
    //   );
    //   throw new UnauthorizedException('TInvalid token or user not found');
    // }
  }
}
