import { TimeEntryType } from "../enums/timeRecording.enum"
import { UserTimeAccount } from "../../entity/UserTimeAccount"
import { isHoliday } from 'feiertagejs'

export interface TimeCalculationResult {
  recorded_hours: number
  interruption_hours: number
}

/**
 * Zählt die Anzahl der Nicht-Arbeitstage (Wochenenden + Feiertage) in einem Zeitraum.
 * Wird verwendet um bei Urlaubseinträgen die tatsächlich verbrauchten Urlaubstage zu ermitteln.
 * @param region - Bundesland-Kürzel für feiertagejs (default: 'NW' = Nordrhein-Westfalen)
 */
export const countNonWorkingDays = (start: Date, end: Date, region: string = 'NW'): number => {
  let count = 0
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  const endDay = new Date(end)
  endDay.setHours(0, 0, 0, 0)

  while (current <= endDay) {
    const dayOfWeek = current.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isPublicHoliday = isHoliday(current, 'NW')

    if (isWeekend || isPublicHoliday) count++

    current.setDate(current.getDate() + 1)
  }

  return count
}

/**
 * Berechnet recorded_hours und interruption_hours für Arbeitseinträge (WORK).
 * Pausenregelungen nach §4 ArbZG:
 * - Ab 6h Arbeitszeit:  30 Minuten Pflichtpause
 * - Ab 9h Arbeitszeit:  45 Minuten Pflichtpause
 * - Maximum: 10h recorded_hours (10h 45min Gesamtarbeitszeit nach §3 ArbZG)
 */
export const calculateWorkHours = (start: Date, end: Date): TimeCalculationResult => {
  const total_hours = (end.getTime() - start.getTime()) / 1000 / 60 / 60

  let interruption_hours = 0
  let recorded_hours = total_hours

  if (total_hours > 6 && total_hours <= 6.5) {
    // Über 6h aber weniger als 6.5h → Überschuss wird zur Pause
    interruption_hours = total_hours - 6
    recorded_hours = 6
  } else if (total_hours > 6.5 && total_hours <= 9) {
    // 30min Pflichtpause greift
    interruption_hours = 0.5
    recorded_hours = total_hours - 0.5
  } else if (total_hours > 9 && total_hours <= 9.5) {
    // Über 9h aber weniger als 9.5h → Überschuss wird zur zusätzlichen Pause
    interruption_hours = 0.5 + (total_hours - 9)
    recorded_hours = 9
  } else if (total_hours > 9.5 && total_hours <= 10) {
    // 45min Pflichtpause greift
    interruption_hours = 0.75
    recorded_hours = total_hours - 0.75
  } else if (total_hours > 10) {
    // Maximum erreicht: 45min Pause, max. 10h recorded
    interruption_hours = 0.75
    recorded_hours = Math.min(total_hours - 0.75, 10)
  }

  return {
    recorded_hours: Math.round(recorded_hours * 100) / 100,
    interruption_hours: Math.round(interruption_hours * 100) / 100,
  }
}

/**
 * Berechnet recorded_hours und interruption_hours für Abwesenheitseinträge.
 *
 * recorded_hours = Arbeitstage im Zeitraum * Soll-Stunden pro Tag
 *   → hält das Zeitkonto in Balance (Abwesenheit = Soll)
 *
 * interruption_hours = Nicht-Arbeitstage (Wochenenden + Feiertage) * 24
 *   → nur bei VACATION gesetzt, damit die tatsächlich verbrauchten Urlaubstage
 *     im Frontend berechnet werden können: (Gesamttage - interruption_hours / 24)
 */
export const calculateAbsenceHours = (
  type: TimeEntryType,
  start: Date,
  end: Date,
  timeAccount: UserTimeAccount
): TimeCalculationResult => {
  const sollPerDay = timeAccount.contract_hours_per_week / timeAccount.working_days_per_week

  const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const nonWorkingDays = type === TimeEntryType.VACATION ? countNonWorkingDays(start, end) : 0
  const workingDays = totalDays - nonWorkingDays

  return {
    recorded_hours: Math.round(workingDays * sollPerDay * 100) / 100,
    interruption_hours: nonWorkingDays * 24,
  }
}

/**
 * Einstiegspunkt für die Stundenberechnung eines Zeiteintrags.
 * Delegiert je nach Typ an calculateWorkHours oder calculateAbsenceHours.
 */
export const calculateTimeEntryHours = (
  type: TimeEntryType,
  start: Date,
  end: Date,
  timeAccount: UserTimeAccount
): TimeCalculationResult => {
  if (type === TimeEntryType.WORK) return calculateWorkHours(start, end)
  return calculateAbsenceHours(type, start, end, timeAccount)
}