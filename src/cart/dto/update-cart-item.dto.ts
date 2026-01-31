import { IsNumber, Min, Max } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../common/constants/validation-messages';

export class UpdateCartItemDto {
  @IsNumber({}, { message: VALIDATION_MESSAGES.MUST_BE_NUMBER('Quantity') })
  @Min(1, { message: VALIDATION_MESSAGES.QUANTITY_MIN })
  @Max(99, { message: VALIDATION_MESSAGES.QUANTITY_MAX })
  quantity: number;
}
