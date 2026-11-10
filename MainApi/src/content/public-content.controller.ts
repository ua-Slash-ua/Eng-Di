import { Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { AboutStatsService } from '../about-stats/about-stats.service';
import { BlocksService } from '../blocks/blocks.service';
import { FaqsService } from '../faqs/faqs.service';
import { FormatsService } from '../formats/formats.service';
import { CreateLeadDto } from '../leads/dto/create-lead.dto';
import { LeadsService } from '../leads/leads.service';
import { PagesService } from '../pages/pages.service';
import { ReviewsService } from '../reviews/reviews.service';
import { RulesService } from '../rules/rules.service';
import { TariffsService } from '../tariffs/tariffs.service';

@Controller()
export class PublicContentController {
  constructor(
    private readonly pages: PagesService,
    private readonly leads: LeadsService,
    private readonly aboutStats: AboutStatsService,
    private readonly formats: FormatsService,
    private readonly tariffs: TariffsService,
    private readonly rules: RulesService,
    private readonly faqs: FaqsService,
    private readonly reviews: ReviewsService,
    private readonly blocks: BlocksService,
  ) {}

  @Get('about-stats')
  listAboutStats(@Query('category') category?: string) {
    return this.aboutStats.list(category);
  }

  @Get('formats')
  listFormats() {
    return this.formats.list();
  }

  @Get('tariffs')
  listTariffs() {
    return this.tariffs.list();
  }

  @Get('rules')
  listRules() {
    return this.rules.list();
  }

  @Get('faqs')
  listFaqs() {
    return this.faqs.list();
  }

  @Get('reviews')
  listReviews() {
    return this.reviews.listPublic();
  }

  @Get('blocks')
  listBlocks(@Query('type') type?: string) {
    return this.blocks.listPublic(type);
  }

  @Get('blocks/:id')
  getBlock(@Param('id', ParseIntPipe) id: number) {
    return this.blocks.findById(id, true);
  }

  @Get('pages/:slug')
  async page(@Param('slug') slug: string) {
    const page = await this.pages.findBySlug(slug);
    if (!page) {
      throw new NotFoundException('Сторінку не знайдено');
    }
    return page;
  }

  @Post('leads')
  async createLead(@Body() dto: CreateLeadDto) {
    const lead = await this.leads.create({
      name: dto.name.trim(),
      phone: dto.phone.trim(),
      email: dto.email?.trim() || undefined,
      message: dto.message?.trim() || undefined,
      category: dto.category,
      location: dto.location,
    });
    return { ok: true, id: lead.id };
  }
}
