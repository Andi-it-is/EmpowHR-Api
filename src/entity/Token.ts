import { PrimaryGeneratedColumn, Column, Generated, CreateDateColumn, Entity, ManyToOne } from "typeorm";
import { User } from "./User";
import { TokenType } from "../lib/enums/tokenType.enum";

@Entity()
export class Token {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @Generated("uuid")
    token: string;

    @Column({
        type: 'enum',
        enum: TokenType,
        default: TokenType.ACCESS
    })
    type: TokenType;

    @Column()
    valid_until: Date;

    @Column({ nullable: true })
    last_used: Date;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn({ select: false })
    created_at: Date;

    @ManyToOne(() => User, user => user.token, { onDelete: "CASCADE" })
    user: User;

    // if parentToken exists, it is an accesstoken related to it. else it is a refreshtoken.
    @ManyToOne(() => Token, { nullable: true, onDelete: "CASCADE" })
    parent_token: Token;
}