import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm"
import { User } from "./User"
import { TimeEntryType, WorkingLocation } from "../lib/enums/timeRecording.enum"
import { UserTimeAccount } from "./UserTimeAccount"

@Entity()
export class TimeEntry {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        type: 'enum',
        enum: WorkingLocation,
        nullable: true  // allow null for abscences/not-working-entries
    })
    working_location: WorkingLocation

    @Column({
        type: 'enum',
        enum: TimeEntryType,
        nullable: false
    })
    type: TimeEntryType

    @Column({ nullable: false })
    start_date: Date

    @Column({ nullable: false })
    end_date: Date

    @Column({ type: 'float', nullable: false, default: 0 })
    interruption_hours: number

    @Column({ type: 'float', nullable: false, default: 0 })
    recorded_hours: number

    @Column({ default: false })
    is_confirmed: boolean

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(() => UserTimeAccount, time_account => time_account.time_entries, { onDelete: 'CASCADE' })
    time_account: UserTimeAccount
}