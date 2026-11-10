import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller()
export class PublicSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('settings/contacts')
  getContacts() {
    return this.settings.getContactsSettingsPayload();
  }

  @Get('settings/branding')
  getBranding() {
    return this.settings.getBrandingSettingsPayload();
  }

  @Get('settings/ui')
  getUi() {
    return this.settings.getUiSettingsPayload();
  }
}
