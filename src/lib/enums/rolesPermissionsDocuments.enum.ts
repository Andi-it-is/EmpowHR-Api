// enums/document.enums.ts

export enum DocumentType {
  CONTRACT = 'CONTRACT',            // Vertrag
  FINANCE = 'FINANCE',              // Finanzen / Lohnabrechnung
  ABSENCE = 'ABSENCE',              // Abwesenheit / Krankmeldung
  QUALIFICATION = 'QUALIFICATION',  // Qualifikation
  COMPLIANCE = 'COMPLIANCE'         // Compliance
}

export enum DocumentSecurityLevel {
  RESTRICTED = 1,            // Dienstgebrauch — alle im Unternehmen
  CONFIDENTIAL = 2,          // Vertraulich — nur Abteilung
  SECRET = 3,                // Geheim — ich, HR, Chef
  TOP_SECRET = 4             // Sehr Geheim — nur ich und HR
}