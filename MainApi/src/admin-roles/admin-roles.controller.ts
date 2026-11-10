import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminPanelGuard } from '../auth/admin-panel.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateAdminRoleDto } from './dto/create-admin-role.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';
import { AdminRolesService } from './admin-roles.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
export class AdminRolesController {
  constructor(private readonly roles: AdminRolesService) {}

  @Get('permissions')
  @Permissions('admin_roles.read')
  listPermissions() {
    return this.roles.listPermissions();
  }

  @Get('admin-roles')
  @Permissions('admin_roles.read')
  listRoles() {
    return this.roles.listRoles();
  }

  @Get('admin-roles/:id')
  @Permissions('admin_roles.read')
  getRole(@Param('id', ParseIntPipe) id: number) {
    return this.roles.getRole(id);
  }

  @Post('admin-roles')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @Permissions('admin_roles.write')
  createRole(@Body() dto: CreateAdminRoleDto) {
    return this.roles.createRole(dto);
  }

  @Patch('admin-roles/:id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @Permissions('admin_roles.write')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminRoleDto) {
    return this.roles.updateRole(id, dto);
  }

  @Delete('admin-roles/:id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @Permissions('admin_roles.write')
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.roles.deleteRole(id);
  }
}
