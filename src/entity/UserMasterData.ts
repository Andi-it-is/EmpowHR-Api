import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from "typeorm"
import { User } from "./User"

@Entity()
export class UserMasterData {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ unique: true })
    company_alias: string

    @Column({ nullable: false })
    street: string

    @Column({ nullable: false })
    zipcode: string

    @Column({ nullable: false })
    city: string

    @Column({ nullable: false })
    country: string

    @Column({ nullable: false, length: 10 })    // iso 8601, but only date part
    date_of_birth: string

    @Column({ nullable: false })
    telephone_business: string

    @Column({ nullable: true })
    telephone_private: string

    @Column({ nullable: false })
    banking_detail: string

    @Column({ nullable: true })
    job_title: string

    @Column({ nullable: false, length: 10 })    // iso 8601, but only date part
    started_working_date: string

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;


    @OneToOne(() => User, user => user.master_data, { onDelete: "CASCADE" })
    @JoinColumn()
    user: User;

}
