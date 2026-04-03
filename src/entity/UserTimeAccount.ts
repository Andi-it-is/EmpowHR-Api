import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from "typeorm"
import { User } from "./User"
import { TimeEntry } from "./TimeEntry"
import { AppDataSource } from "../AppDataSource"

@Entity()
export class UserTimeAccount {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: "float", nullable: false, default: 40 })
    contract_hours_per_week: number

    @Column({ type: "float", nullable: false, default: 5 })
    working_days_per_week: number

    @Column({ type: "float", nullable: false, default: 30 })
    vacation_days_per_year: number

    @Column({ nullable: false, default: 0 })
    delta_hours: number

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;


    @OneToMany(() => TimeEntry, time_entry => time_entry.time_account)
    time_entries: TimeEntry[]

    @OneToOne(() => User, user => user.time_account, { onDelete: "CASCADE" })
    @JoinColumn()
    user: User;

}
