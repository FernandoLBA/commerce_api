import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  // =============== ATTRIBUTES ===============

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createAttributeDto: CreateAttributeDto) {
    return this.attributesService.createAttribute(createAttributeDto);
  }

  @Get()
  findAll() {
    return this.attributesService.findAllAttributes();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributesService.findAttributeById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttributeDto: UpdateAttributeDto,
  ) {
    return this.attributesService.updateAttribute(id, updateAttributeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributesService.deleteAttribute(id);
  }

  // =============== ATTRIBUTE VALUES ===============

  @Post('values')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createValue(@Body() createAttributeValueDto: CreateAttributeValueDto) {
    return this.attributesService.createAttributeValue(createAttributeValueDto);
  }

  @Get('values/:id')
  findValue(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributesService.findAttributeValueById(id);
  }

  @Patch('values/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttributeValueDto: UpdateAttributeValueDto,
  ) {
    return this.attributesService.updateAttributeValue(
      id,
      updateAttributeValueDto,
    );
  }

  @Delete('values/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  removeValue(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributesService.deleteAttributeValue(id);
  }
}
