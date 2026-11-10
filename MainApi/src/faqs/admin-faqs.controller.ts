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

import { CreateFaqDto } from './dto/create-faq.dto';

import { ListFaqsDto } from './dto/list-faqs.dto';

import { UpdateFaqDto } from './dto/update-faq.dto';

import { FaqsService } from './faqs.service';



@Controller('admin')

@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)

export class AdminFaqsController {

  constructor(private readonly faqs: FaqsService) {}



  @Get('faqs')

  @Permissions('faqs.read')

  listFaqs(@Query() query: ListFaqsDto) {

    return this.faqs.listAdmin(query);

  }



  @Post('faqs')

  @Permissions('faqs.write')

  createFaq(@Body() dto: CreateFaqDto) {

    return this.faqs.create(dto);

  }



  @Get('faqs/:id')

  @Permissions('faqs.read')

  getFaq(@Param('id', ParseIntPipe) id: number) {

    return this.faqs.findById(id);

  }



  @Patch('faqs/:id')

  @Permissions('faqs.write')

  updateFaq(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFaqDto) {

    return this.faqs.update(id, dto);

  }



  @Delete('faqs/:id')

  @Permissions('faqs.delete')

  deleteFaq(@Param('id', ParseIntPipe) id: number) {

    return this.faqs.remove(id);

  }

}


