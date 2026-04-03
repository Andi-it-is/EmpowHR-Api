import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm"
import { BookableResource } from "./BookableRessource"
import { User } from "./User"

@Entity()
export class ResourceBookingEntry {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false })
    start_date: Date

    @Column({ nullable: false })
    end_date: Date

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @ManyToOne(() => BookableResource, { nullable: false, onDelete: 'CASCADE' })
    bookable_resource: BookableResource

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    user: User
}