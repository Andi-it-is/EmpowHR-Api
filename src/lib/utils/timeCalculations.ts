import { TimeEntryType } from "../enums/timeRecording.enum"
import { UserTimeAccount } from "../../entity/UserTimeAccount"

export interface TimeCalculationResult {
  recorded_hours: number
  interruption_hours: number
}

export const calculateWorkHours = (start: Date, end: Date): TimeCalculationResult => {
  const total_hours = (end.getTime() - start.getTime()) / 1000 / 60 / 60

  let interruption_hours = 0
  let recorded_hours = total_hours

  if (total_hours > 6 && total_hours <= 6.5) {
    interruption_hours = total_hours - 6
    recorded_hours = 6
  } else if (total_hours > 6.5 && total_hours <= 9) {
    interruption_hours = 0.5
    recorded_hours = total_hours - 0.5
  } else if (total_hours > 9 && total_hours <= 9.5) {
    interruption_hours = 0.5 + (total_hours - 9)
    recorded_hours = 9
  } else if (total_hours > 9.5 && total_hours <= 10) {
    interruption_hours = 0.75
    recorded_hours = total_hours - 0.75
  } else if (total_hours > 10) {
    interruption_hours = 0.75
    recorded_hours = Math.min(total_hours - 0.75, 10)
  }

  return {
    recorded_hours: Math.round(recorded_hours * 100) / 100,
    interruption_hours: Math.round(interruption_hours * 100) / 100,
  }
}

export const calculateAbsenceHours = (timeAccount: UserTimeAccount): TimeCalculationResult => {
  const recorded_hours = timeAccount.contract_hours_per_week / timeAccount.working_days_per_week
  return {
    recorded_hours: Math.round(recorded_hours * 100) / 100,
    interruption_hours: 0,
  }
}

export const calculateTimeEntryHours = (
  type: TimeEntryType,
  start: Date,
  end: Date,
  timeAccount: UserTimeAccount
): TimeCalculationResult => {
  return type === TimeEntryType.WORK
    ? calculateWorkHours(start, end)
    : calculateAbsenceHours(timeAccount)
}