import dayjs from "dayjs";
import { MoreThan } from "typeorm";

import { AppDataSource } from "../AppDataSource";
import { RefreshToken } from "../entity/Token";
import { User } from "../entity/User";
import { APIError } from "../lib/classes/APIError";

async function list(user: User): Promise<RefreshToken[]> {

    const _authenticable = await AppDataSource
        .getRepository(User)
        .findOne({
            where: { id: user.id },
            relations: ["refreshTokens"]
        });

    return _authenticable.refreshTokens;

}

async function findActiveTokenByUser(user: User): Promise<RefreshToken | null> {
    return await AppDataSource
        .getRepository(RefreshToken)
        .findOne({
            where: {
                user: { id: user.id },
                isActive: true,
                validUntil: MoreThan(dayjs().toDate())
            },
            relations: ['user']
        });
}

async function findActiveTokenByUserId(userId: number): Promise<RefreshToken | null> {
    return await await AppDataSource
        .getRepository(RefreshToken)
        .findOne({
            where: {
                user: { id: userId },
                isActive: true,
                validUntil: MoreThan(dayjs().toDate())
            },
            relations: ['user']
        });
}

export const refreshTokenService = {
    list,
    findActiveTokenByUser,
    findActiveTokenByUserId
};