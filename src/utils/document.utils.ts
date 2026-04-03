import { DocumentSecurityLevel } from "../lib/enums/acessControl.enum"

export const securityLevelLabels: Record<DocumentSecurityLevel, string> = {
  [DocumentSecurityLevel.RESTRICTED]: 'Restricted',
  [DocumentSecurityLevel.CONFIDENTIAL]: 'Confidential',
  [DocumentSecurityLevel.SECRET]: 'Secret',
  [DocumentSecurityLevel.TOP_SECRET]: 'Top Secret',
}

export function getSecurityLevelLabel(level: DocumentSecurityLevel): string {
  return securityLevelLabels[level] ?? 'Unbekannt'
}

export function canViewDocument(userMaxLevel: DocumentSecurityLevel, documentLevel: DocumentSecurityLevel): boolean {
  return documentLevel <= userMaxLevel
}