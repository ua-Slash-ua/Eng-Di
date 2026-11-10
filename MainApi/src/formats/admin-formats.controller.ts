import {

  Body,

  Controller,

  Delete,

  Get,

  Param,

  ParseIntPipe,

  Patch,

  Post,

  Query,

  UseGuards,

} from '@nestjs/common';

import { AdminPanelGuard } from '../auth/admin-panel.guard';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { Permissions } from '../auth/permissions.decorator';

import { PermissionsGuard } from '../auth/permissions.guard';

import { CreateFormatDto } from './dto/create-format.dto';

import { ListFormatsDto } from './dto/list-formats.dto';

import { UpdateFormatDto } from './dto/update-format.dto';

import { FormatsService } from './formats.service';



@Controller('admin')

@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)

export class AdminFormatsController {

  constructor(private readonly formats: FormatsService) {}



  @Get('formats')

  @Permissions('formats.read')

  listFormats(@Query() query: ListFormatsDto) {

    return this.formats.listAdmin(query);

  }



  @Post('formats')

  @Permissions('formats.write')

  createFormat(@Body() dto: CreateFormatDto) {

    return this.formats.create(dto);

  }



  @Get('formats/:id')

  @Permissions('formats.read')

  getFormat(@Param('id', ParseIntPipe) id: number) {

    return this.formats.findById(id);

  }



  @Patch('formats/:id')

  @Permissions('formats.write')

  updateFormat(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFormatDto) {

    return this.formats.update(id, dto);

  }



  @Delete('formats/:id')

  @Permissions('formats.delete')

  deleteFormat(@Param('id', ParseIntPipe) id: number) {

    return this.formats.remove(id);

  }

}


