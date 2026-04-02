export enum WorkingLocation {
  OFFICE = 'OFFICE',                      // Büro
  REMOTE = 'REMOTE',                      // Remote
  FIELD_SERVICE = 'FIELD_SERVICE'         // Dienstreise
}

export enum TimeEntryType {
  WORK = 'WORK',                          // Reguläre Arbeit
  VACATION = 'VACATION',                  // Urlaub
  SICK = 'SICK',                          // Krankheit
  SICK_CHILD = 'SICK_CHILD',              // Kind krank (§45 SGB V)
  EDUCATION = 'EDUCATION',                // Fortbildung
  PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY',      // Feiertag
  COMPENSATORY_OFF = 'COMPENSATORY_OFF',  // Überstundenabbau
  SPECIAL_LEAVE = 'SPECIAL_LEAVE',        // Sonderurlaub (Hochzeit, Todesfall etc.)
  PARENTAL_LEAVE = 'PARENTAL_LEAVE',      // Elternzeit
  UNPAID_LEAVE = 'UNPAID_LEAVE',          // Unbezahlter Urlaub
  ON_CALL = 'ON_CALL',                    // Bereitschaftsdienst
}