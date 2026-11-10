import { Body, Controller, Get, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminPanelGuard } from '../auth/admin-panel.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { UpdateBrandingSettingsDto } from './dto/update-branding-settings.dto';
import { UpdateContactsSettingsDto } from './dto/update-contacts-settings.dto';
import { UpdateMailingSettingsDto } from './dto/update-mailing-settings.dto';
import { UpdateMediaSettingsDto } from './dto/update-media-settings.dto';
import { UpdatePresentationSettingsDto } from './dto/update-presentation-settings.dto';
import { UpdateUiSettingsDto } from './dto/update-ui-settings.dto';
import { SettingsService } from './settings.service';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('media')
  @Permissions('settings.read')
  getMedia() {
    return this.settings.getMediaSettingsPayload();
  }

  @Patch('media')
  @Permissions('settings.write')
  updateMedia(@Body() dto: UpdateMediaSettingsDto) {
    return this.settings.updateMediaSettings(dto);
  }

  @Get('presentations')
  @Permissions('settings.read')
  getPresentations() {
    return this.settings.getPresentationSettingsPayload();
  }

  @Patch('presentations')
  @Permissions('settings.write')
  updatePresentations(@Body() dto: UpdatePresentationSettingsDto) {
    return this.settings.updatePresentationSettings(dto);
  }

  @Get('contacts')
  @Permissions('settings.read')
  getContacts() {
    return this.settings.getContactsSettingsPayload();
  }

  @Patch('contacts')
  @Permissions('settings.write')
  updateContacts(@Body() dto: UpdateContactsSettingsDto) {
    return this.settings.updateContactsSettings(dto);
  }

  @Get('mailings')
  getMailings() {
    return this.settings.getMailingSettingsPayload();
  }

  @Patch('mailings')
  updateMailings(@Body() dto: UpdateMailingSettingsDto) {
    return this.settings.updateMailingSettings(dto);
  }

  @Get('ui')
  @Permissions('settings.read')
  getUi() {
    return this.settings.getUiSettingsPayload();
  }

  @Patch('ui')
  @Permissions('settings.write')
  updateUi(@Body() dto: UpdateUiSettingsDto) {
    return this.settings.updateUiSettings(dto);
  }

  @Get('branding')
  @Permissions('settings.read')
  getBranding() {
    return this.settings.getBrandingSettingsPayload();
  }

  @Patch('branding')
  @Permissions('settings.write')
  updateBranding(@Body() dto: UpdateBrandingSettingsDto) {
    return this.settings.updateBrandingSettings(dto);
  }

  @Post('branding/logo')
  @Permissions('settings.write')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    return this.settings.uploadBrandingFile('logo', file);
  }

  @Post('branding/favicon')
  @Permissions('settings.write')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadFavicon(@UploadedFile() file: Express.Multer.File) {
    return this.settings.uploadBrandingFile('favicon', file);
  }
}
