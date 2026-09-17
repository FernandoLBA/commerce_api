import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JWT_CONSTANTS } from '../../common/constants/jwt.constants';

/**
 * JWT strategy to validate Bearer tokens in HTTP requests.
 * Validates that the token is valid and that the user exists in the database.
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
   * Validates the JWT token payload.
   * @param payload - Decoded JWT token payload
   * @returns Validated user data
   * @throws UnauthorizedException if the user does not exist
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

    if (!user.emailVerified) {
      this.logger.warn(`Attempted access with inactive user: ${payload.id}`);
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
