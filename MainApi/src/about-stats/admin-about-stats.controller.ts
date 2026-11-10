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

import { BlocksService } from '../blocks/blocks.service';

import { AboutStatsService } from './about-stats.service';

import { CreateAboutStatCategoryDto } from './dto/create-about-stat-category.dto';

import { CreateAboutStatDto } from './dto/create-about-stat.dto';

import { ListAboutStatsDto } from './dto/list-about-stats.dto';

import { UpdateAboutStatCategoryDto } from './dto/update-about-stat-category.dto';

import { UpdateAboutStatDto } from './dto/update-about-stat.dto';



@Controller('admin')

@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)

export class AdminAboutStatsController {

  constructor(

    private readonly aboutStats: AboutStatsService,

    private readonly blocks: BlocksService,

  ) {}



  @Get('about-stat-categories')

  @Permissions('about_stats.read')

  listAboutStatCategories() {

    return this.aboutStats.listCategories();

  }



  @Post('about-stat-categories')

  @Permissions('about_stats.write')

  createAboutStatCategory(@Body() dto: CreateAboutStatCategoryDto) {

    return this.aboutStats.createCategory(dto);

  }



  @Patch('about-stat-categories/:id')

  @Permissions('about_stats.write')

  updateAboutStatCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAboutStatCategoryDto) {

    return this.aboutStats.updateCategory(id, dto);

  }



  @Delete('about-stat-categories/:id')

  @Permissions('about_stats.delete')

  deleteAboutStatCategory(@Param('id', ParseIntPipe) id: number) {

    return this.aboutStats.removeCategory(id);

  }



  @Get('about-stats')

  @Permissions('about_stats.read')

  listAboutStats(@Query() query: ListAboutStatsDto) {

    return this.aboutStats.listAdmin(query);

  }



  /** Full catalog for pickers (block stat multiselect) — declared before `:id` so it is not parsed as an id. */

  @Get('about-stats/catalog')

  @Permissions('about_stats.read')

  aboutStatsCatalog(@Query('category') category?: string) {

    return this.aboutStats.list(category);

  }



  @Post('about-stats')

  @Permissions('about_stats.write')

  createAboutStat(@Body() dto: CreateAboutStatDto) {

    return this.aboutStats.create(dto);

  }



  @Get('about-stats/:id')

  @Permissions('about_stats.read')

  getAboutStat(@Param('id', ParseIntPipe) id: number) {

    return this.aboutStats.findById(id);

  }



  @Get('about-stats/:id/usage')

  @Permissions('about_stats.read')

  aboutStatUsage(@Param('id', ParseIntPipe) id: number) {

    return this.blocks.usageByRecord('stat_ids', id);

  }



  @Patch('about-stats/:id')

  @Permissions('about_stats.write')

  updateAboutStat(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAboutStatDto) {

    return this.aboutStats.update(id, dto);

  }



  @Delete('about-stats/:id')

  @Permissions('about_stats.delete')

  deleteAboutStat(@Param('id', ParseIntPipe) id: number) {

    return this.aboutStats.remove(id);

  }

}


