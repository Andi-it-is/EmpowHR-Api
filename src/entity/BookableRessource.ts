import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm"
import { Location } from "./Location"

@Entity()
export class BookableResource {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: true })
    level: number

    @Column({ nullable: true })
    building_section: number

    @Column({ nullable: true })
    room_number: number

    // Virtual column: z.B. "4.6.13"
    get identifier(): string {
        return `${this.level}.${this.building_section}.${this.room_number}`
    }

    @Column({ nullable: false })
    label: string

    @Column({ type: 'simple-array', nullable: true })
    equipment: string[]

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(() => Location, { nullable: false, onDelete: 'CASCADE' })
    location: Location
}