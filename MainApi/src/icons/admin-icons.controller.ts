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

  UploadedFiles,

  UseGuards,

  UseInterceptors,

} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';

import { memoryStorage } from 'multer';

import { AdminPanelGuard } from '../auth/admin-panel.guard';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { Permissions } from '../auth/permissions.decorator';

import { PermissionsGuard } from '../auth/permissions.guard';

import { CreateIconDto } from './dto/create-icon.dto';

import { CreateIconGroupDto } from './dto/create-icon-group.dto';

import { BulkDeleteIconsDto } from './dto/bulk-delete-icons.dto';

import { ListIconsDto } from './dto/list-icons.dto';

import { UpdateIconDto } from './dto/update-icon.dto';

import { UpdateIconGroupDto } from './dto/update-icon-group.dto';

import { IconsService, type UploadMetaItem } from './icons.service';



@Controller('admin')

@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)

export class AdminIconsController {

  constructor(private readonly icons: IconsService) {}



  @Get('icon-groups')

  @Permissions('icons.read')

  listGroups(@Query('type') type?: string) {

    return this.icons.listGroups(type);

  }



  @Post('icon-groups')

  @Permissions('icons.write')

  createGroup(@Body() dto: CreateIconGroupDto) {

    return this.icons.createGroup(dto);

  }



  @Patch('icon-groups/:id')

  @Permissions('icons.write')

  updateGroup(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIconGroupDto) {

    return this.icons.updateGroup(id, dto);

  }



  @Delete('icon-groups/:id')

  @Permissions('icons.delete')

  deleteGroup(@Param('id', ParseIntPipe) id: number) {

    return this.icons.removeGroup(id);

  }



  @Get('icons/catalog')

  @Permissions('icons.read')

  catalog(@Query('groupId') groupId?: string, @Query('type') type?: string) {

    const id = groupId ? Number(groupId) : undefined;

    return this.icons.catalog({

      type,

      groupId: Number.isFinite(id) ? id : undefined,

    });

  }



  @Get('icons')

  @Permissions('icons.read')

  listIcons(@Query() query: ListIconsDto) {

    return this.icons.listAdmin(query);

  }



  @Post('icons/upload')

  @Permissions('icons.write')

  @UseInterceptors(

    FilesInterceptor('files', 40, {

      storage: memoryStorage(),

      // Hard ceiling; actual limit comes from settings.maxImageMb in service.

      limits: { fileSize: 200 * 1024 * 1024 },

    }),

  )

  uploadImages(

    @UploadedFiles() files: Express.Multer.File[],

    @Body('meta') metaRaw?: string,

    @Body('groupId') groupIdRaw?: string,

  ) {

    let meta: UploadMetaItem[] = [];

    if (metaRaw) {

      try {

        meta = JSON.parse(metaRaw) as UploadMetaItem[];

      } catch {

        meta = [];

      }

    }

    const groupId = groupIdRaw ? Number(groupIdRaw) : null;

    return this.icons.uploadImages(files ?? [], meta, Number.isFinite(groupId) ? groupId : null);

  }



  @Post('icons')

  @Permissions('icons.write')

  createIcon(@Body() dto: CreateIconDto) {

    return this.icons.create(dto);

  }



  @Post('icons/bulk-delete')

  @Permissions('icons.delete')

  bulkDeleteIcons(@Body() dto: BulkDeleteIconsDto) {

    return this.icons.removeMany(dto.ids);

  }



  @Get('icons/:id')

  @Permissions('icons.read')

  getIcon(@Param('id', ParseIntPipe) id: number) {

    return this.icons.findById(id);

  }



  @Patch('icons/:id')

  @Permissions('icons.write')

  updateIcon(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIconDto) {

    return this.icons.update(id, dto);

  }



  @Delete('icons/:id')

  @Permissions('icons.delete')

  deleteIcon(@Param('id', ParseIntPipe) id: number) {

    return this.icons.remove(id);

  }

}


