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
import { CreateLeadCategoryDto } from './dto/create-lead-category.dto';
import { UpdateLeadCategoryDto } from './dto/update-lead-category.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get('lead-categories')
  @Permissions('leads.read')
  listLeadCategories() {
    return this.leads.listCategories();
  }

  @Post('lead-categories')
  @Permissions('leads.write')
  createLeadCategory(@Body() dto: CreateLeadCategoryDto) {
    return this.leads.createCategory({ slug: dto.slug, title: dto.title });
  }

  @Patch('lead-categories/:id')
  @Permissions('leads.write')
  updateLeadCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadCategoryDto) {
    return this.leads.updateCategory(id, dto);
  }

  @Delete('lead-categories/:id')
  @Permissions('leads.write')
  deleteLeadCategory(@Param('id', ParseIntPipe) id: number) {
    return this.leads.removeCategory(id);
  }

  @Get('leads')
  @Permissions('leads.read')
  listLeads(
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('lead') lead?: string,
    @Query('location') location?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leads.list({
      q,
      status,
      category,
      lead,
      location,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }

  @Get('leads/:id')
  @Permissions('leads.read')
  getLead(@Param('id', ParseIntPipe) id: number) {
    return this.leads.findById(id);
  }

  @Patch('leads/:id')
  @Permissions('leads.write')
  updateLead(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadDto) {
    return this.leads.update(id, { status: dto.status, categoryId: dto.categoryId });
  }
}
