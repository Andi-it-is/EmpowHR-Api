// src/lib/helpers/checkPermissionScope.ts

import { PermissionScope } from "../enums/acessControl.enum"
import { User } from "../../entity/User"
import { AppDataSource } from "../../AppDataSource"

interface ScopeCheckOptions {
  requestingUserId: string
  allowedScope: PermissionScope
  resolveTargetUserId: () => string | undefined
  resolveTargetDepartmentId: () => string | undefined
}

export async function getRequestingUser(userId: string): Promise<User | null> {
  return AppDataSource.getRepository(User).findOne({
    where: { id: userId },
    relations: {
      department: true,
      subordinates: true,
      ledDepartments: true
    }
  })
}

export async function checkPermissionScope(options: ScopeCheckOptions): Promise<boolean> {
  const { requestingUserId, allowedScope, resolveTargetUserId, resolveTargetDepartmentId } = options

  if (allowedScope === PermissionScope.ALL) return true

  const requestingUser = await getRequestingUser(requestingUserId)
  if (!requestingUser) return false

  if (allowedScope === PermissionScope.SELF) {
    return requestingUser.id === resolveTargetUserId()
  }

  if (allowedScope === PermissionScope.SUBORDINATE) {
    return resolveTargetUserId() !== undefined &&
      requestingUser.subordinates?.some(s => s.id === resolveTargetUserId())
  }

  if (allowedScope === PermissionScope.DEPARTMENT) {
    return requestingUser.department?.id === resolveTargetDepartmentId()
  }

  return false
}