import { IsEnum, IsNotEmpty } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';
import { Role } from '../../common/enums/role.enum';

export class UpdateRoleDto {
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Role') })
  @IsEnum(Role, {
    message: VALIDATION_MESSAGES.INVALID_ENUM('Role', 'ADMIN, USER'),
  })
  role: Role;
}
