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
import { BlocksService } from './blocks.service';
import { CreateContentBlockDto } from './dto/create-content-block.dto';
import { ListBlocksDto } from './dto/list-blocks.dto';
import { UpdateContentBlockDto } from './dto/update-content-block.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminBlocksController {
  constructor(private readonly blocks: BlocksService) {}

  @Get('blocks')
  @Permissions('blocks.read')
  listBlocks(@Query() query: ListBlocksDto) {
    return this.blocks.listAdmin(query);
  }

  @Get('blocks/catalog')
  @Permissions('blocks.read')
  catalogBlocks() {
    return this.blocks.catalog();
  }

  @Post('blocks')
  @Permissions('blocks.write')
  createBlock(@Body() dto: CreateContentBlockDto) {
    return this.blocks.create(dto);
  }

  @Get('blocks/:id')
  @Permissions('blocks.read')
  getBlock(@Param('id', ParseIntPipe) id: number) {
    return this.blocks.findById(id);
  }

  @Get('blocks/:id/usage')
  @Permissions('blocks.read')
  blockUsage(@Param('id', ParseIntPipe) id: number) {
    return this.blocks.usage(id);
  }

  @Patch('blocks/:id')
  @Permissions('blocks.write')
  updateContentBlock(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContentBlockDto) {
    return this.blocks.update(id, {
      type: dto.type,
      name: dto.name,
      plaque: dto.plaque,
      title: dto.title,
      meta: dto.meta,
    });
  }

  @Delete('blocks/:id')
  @Permissions('blocks.delete')
  deleteContentBlock(@Param('id', ParseIntPipe) id: number) {
    return this.blocks.remove(id);
  }
}
