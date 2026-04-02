import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, OneToOne, ManyToOne } from "typeorm"
import { Token } from "./Token"
import { UserMasterData } from "./UserMasterData"
import { UserTimeAccount } from "./UserTimeAccount"
import { Document } from "./Document"
import { Certificate } from "./Certificate"
import { Department } from "./Department"

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false })
    firstname: string

    @Column({ nullable: false })
    lastname: string

    @Column({ unique: true })
    email: string

    @Column({ nullable: false, select: false })
    password_hash: string

    @Column({ default: false })
    disabled: boolean

    @Column({ default: 0 })
    failed_login_attempts: number

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;


    @OneToMany(() => Token, token => token.user)
    token: Token[];

    @OneToOne(() => UserMasterData, master_data => master_data.user, { cascade: true })
    master_data: UserMasterData;

    @OneToOne(() => UserTimeAccount, time_account => time_account.user, { cascade: true })
    time_account: UserTimeAccount;

    @OneToMany(() => Document, document => document.user)
    documents: Document[]

    @OneToMany(() => Certificate, certificate => certificate.user)
    certificates: Certificate[]

    @ManyToOne(() => Department, department => department.users, { nullable: true })
    department: Department
}
