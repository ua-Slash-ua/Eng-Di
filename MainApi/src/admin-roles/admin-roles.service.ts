import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSION_CATALOG } from '../auth/permissions.catalog';

@Injectable()
export class AdminRolesService {
  constructor(private readonly prisma: PrismaService) {}

  listPermissions() {
    const groups = new Map<string, { groupLabel: string; permissions: typeof PERMISSION_CATALOG }>();
    for (const item of PERMISSION_CATALOG) {
      const bucket = groups.get(item.groupLabel) ?? { groupLabel: item.groupLabel, permissions: [] };
      bucket.permissions.push(item);
      groups.set(item.groupLabel, bucket);
    }
    return { groups: [...groups.values()] };
  }

  async listRoles() {
    const rows = await this.prisma.adminRole.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
    return {
      roles: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        isSystem: row.isSystem,
        userCount: row._count.users,
        permissionKeys: row.permissions.map((p) => p.permission.key),
      })),
    };
  }

  async getRole(id: number) {
    const row = await this.prisma.adminRole.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
    if (!row) {
      throw new NotFoundException('Роль доступу не знайдено');
    }
    return {
      role: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        isSystem: row.isSystem,
        userCount: row._count.users,
        permissionKeys: row.permissions.map((p) => p.permission.key),
      },
    };
  }

  private slugify(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0400-\u04FF]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || `role-${Date.now()}`;
  }

  async createRole(data: { name: string; description?: string; permissionKeys: string[] }) {
    const name = data.name.trim();
    if (!name) {
      throw new BadRequestException('Назва ролі обовʼязкова');
    }
    const slug = this.slugify(name);
    const existing = await this.prisma.adminRole.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      throw new ConflictException('Роль з такою назвою вже існує');
    }
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: data.permissionKeys } },
    });
    const row = await this.prisma.adminRole.create({
      data: {
        name,
        slug,
        description: data.description?.trim() || null,
        isSystem: false,
        permissions: {
          create: permissions.map((p) => ({ permissionId: p.id })),
        },
      },
    });
    return this.getRole(row.id);
  }

  async updateRole(
    id: number,
    data: { name?: string; description?: string | null; permissionKeys?: string[] },
  ) {
    const existing = await this.prisma.adminRole.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Роль доступу не знайдено');
    }
    const name = data.name?.trim();
    if (name && name !== existing.name) {
      const taken = await this.prisma.adminRole.findFirst({
        where: { name, NOT: { id } },
      });
      if (taken) {
        throw new ConflictException('Роль з такою назвою вже існує');
      }
    }
    if (data.permissionKeys) {
      const permissions = await this.prisma.permission.findMany({
        where: { key: { in: data.permissionKeys } },
      });
      await this.prisma.adminRolePermission.deleteMany({ where: { adminRoleId: id } });
      if (permissions.length) {
        await this.prisma.adminRolePermission.createMany({
          data: permissions.map((p) => ({ adminRoleId: id, permissionId: p.id })),
        });
      }
    }
    await this.prisma.adminRole.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      },
    });
    return this.getRole(id);
  }

  async deleteRole(id: number) {
    const existing = await this.prisma.adminRole.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Роль доступу не знайдено');
    }
    if (existing.isSystem) {
      throw new BadRequestException('Системну роль не можна видалити');
    }
    if (existing._count.users > 0) {
      throw new BadRequestException('Роль призначена користувачам');
    }
    await this.prisma.adminRole.delete({ where: { id } });
    return { ok: true };
  }
}
