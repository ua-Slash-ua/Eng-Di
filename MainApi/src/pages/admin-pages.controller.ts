import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
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
import { CreatePageDto } from './dto/create-page.dto';
import { AttachPageSectionDto, ReorderPageSectionsDto } from './dto/page-section.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PagesService } from './pages.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminPagesController {
  constructor(private readonly pages: PagesService) {}

  @Get('pages')
  @Permissions('pages.read')
  listPages(
    @Query('q') q?: string,
    @Query('title') title?: string,
    @Query('slug') slug?: string,
    @Query('seo') seo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.pages.list({
      q,
      title,
      slug,
      seo,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }

  @Post('pages')
  @Permissions('pages.write')
  createPage(@Body() dto: CreatePageDto) {
    return this.pages.create({ slug: dto.slug, title: dto.title });
  }

  @Get('pages/:id')
  @Permissions('pages.read')
  async getPage(@Param('id', ParseIntPipe) id: number) {
    const page = await this.pages.findById(id);
    if (!page) {
      throw new NotFoundException('Сторінку не знайдено');
    }
    return page;
  }

  @Patch('pages/:id')
  @Permissions('pages.write')
  updatePage(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePageDto) {
    return this.pages.update(id, {
      slug: dto.slug,
      title: dto.title,
      seo: dto.seo,
    });
  }

  @Delete('pages/:id')
  @Permissions('pages.delete')
  deletePage(@Param('id', ParseIntPipe) id: number) {
    return this.pages.remove(id);
  }

  @Post('pages/:id/sections')
  @Permissions('pages.write')
  attachSection(@Param('id', ParseIntPipe) id: number, @Body() dto: AttachPageSectionDto) {
    return this.pages.attachSection(id, dto.blockId);
  }

  @Patch('pages/:id/sections/reorder')
  @Permissions('pages.write')
  reorderSections(@Param('id', ParseIntPipe) id: number, @Body() dto: ReorderPageSectionsDto) {
    return this.pages.reorderSections(id, dto.sectionIds);
  }

  @Delete('page-sections/:id')
  @Permissions('pages.write')
  detachSection(@Param('id', ParseIntPipe) id: number) {
    return this.pages.detachSection(id);
  }
}
