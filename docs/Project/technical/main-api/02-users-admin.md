# MainApi — Users & Admin

← [MainApi](./README.md)

## Users module

```
users/
├── users.module.ts
├── users.service.ts
├── teacher-students.service.ts
├── user.mapper.ts
├── user.types.ts
└── class.module.ts + cabinet-class.controller.ts
```

### CabinetClassController — `/api/cabinet/class`

Guards: JWT + UserPanel

| Method | Path | Опис |
|--------|------|------|
| GET | `/` | Teacher's class (students list) |
| GET | `students/:id` | Student card for teacher |

---

## UsersService — методи

| Метод | Опис |
|-------|------|
| `pendingTtlMs()` | TTL for pending accounts |
| `findByEmail(email)` | Lookup |
| `findById(id)` | Lookup with relations |
| `createUser(data)` | Create with password hash |
| `createWithTemporaryPassword(data)` | Generate pendingPassword |
| `activateIfPending(id)` | First login activation |
| `purgeExpiredPendingUsers()` | Cron cleanup |
| `updateProfile(id, data)` | Profile fields |
| `updateAvatar(id, url)` | avatarUrl |
| `setPassword(id, password)` | bcrypt hash |
| `setStatus(id, status)` | active/blocked |
| `setStatusWhere(status, where)` | Bulk |
| `resetWithTemporaryPassword(id)` | Admin reset |
| `list(query)` | Paginated admin list |
| `deleteById(id)` | SuperAdmin only |
| `adminUpdate(id, data)` | Admin field update |
| `toPublic(user)` | → PublicUser |
| `toAdminPublic(user, ttlMs?)` | → AdminUser with pending info |

---

## TeacherStudentsService — методи

| Метод | Опис |
|-------|------|
| `directory(userRole?)` | User picker list |
| `getClass(userId)` | Teacher → students[] |
| `studentForTeacher(teacherId, studentId)` | Student detail card |
| `setTeacher(studentId, teacherId)` | Assign teacher (null = unassign) |
| `addStudent(teacherId, studentId)` | Link (sets teacherId) |
| `removeStudent(teacherId, studentId)` | Unlink |
| `syncRole(userId, prev, next)` | On role change cleanup |

---

## Admin module

```
admin/
├── admin.module.ts
├── admin.controller.ts
├── admin-stats.service.ts
└── dto/
```

### AdminController — `/api/admin`

| Method | Path | Permission | Guards extra |
|--------|------|------------|--------------|
| GET | `stats` | dashboard.read | |
| GET | `users` | users.read | paginated list |
| GET | `users/directory` | users.read | picker |
| GET | `users/:id/class` | users.read | |
| PATCH | `users/:id/teacher` | users.write | SetTeacherDto |
| POST | `users/:id/students` | users.write | AddStudentDto |
| DELETE | `users/:id/students/:studentId` | users.write | |
| GET | `users/:id` | users.read | |
| GET | `users/:id/tariffs` | users.read | UserTariffs |
| PATCH | `users/:id/tariffs/:subId/payments` | users.write | SetTariffPaymentsDto |
| PATCH | `users/:id` | users.write | UpdateUserDto |
| POST | `users` | users.write | CreateUserDto |
| DELETE | `users/:id` | users.write | SuperAdminOnly |

### AdminStatsService

| Метод | Опис |
|-------|------|
| `getStats()` | `{ users, admins, students, teachers, pages }` counts |

---

## AdminRoles module

```
admin-roles/
├── admin-roles.module.ts
├── admin-roles.controller.ts
├── admin-roles.service.ts
└── dto/
```

### AdminRolesController

| Method | Path | Permission | Extra |
|--------|------|------------|-------|
| GET | `permissions` | admin_roles.read | Grouped catalog |
| GET | `admin-roles` | admin_roles.read | |
| GET | `admin-roles/:id` | admin_roles.read | |
| POST | `admin-roles` | admin_roles.write | SuperAdmin RolesGuard |
| PATCH | `admin-roles/:id` | admin_roles.write | SuperAdmin |
| DELETE | `admin-roles/:id` | admin_roles.write | SuperAdmin, non-system only |

### AdminRolesService

| Метод | Опис |
|-------|------|
| `listPermissions()` | From PERMISSION_CATALOG grouped |
| `listRoles()` | All roles + permission keys |
| `getRole(id)` | Detail |
| `createRole(data)` | name, description, permissionKeys[] |
| `updateRole(id, data)` | |
| `deleteRole(id)` | Fail if isSystem |

---

## DTOs

| DTO | Поля |
|-----|------|
| `CreateUserDto` | email!, firstName!, lastName!, middleName?, name?, birthDate?, userRole?, isSuperAdmin?, adminRoleId? |
| `UpdateUserDto` | email?, firstName?, lastName?, middleName?, name?, phone?, userRole?, isSuperAdmin?, adminRoleId?, birthDate? |
| `AddStudentDto` | studentId! |
| `SetTeacherDto` | teacherId! (number \| null) |
| `CreateAdminRoleDto` | name!, description?, permissionKeys![] |
| `UpdateAdminRoleDto` | name?, description?, permissionKeys?[] |
| `SetTariffPaymentsDto` | paidCount! |
