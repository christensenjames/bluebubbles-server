import { Next } from "koa";
import { RouterContext } from "koa-router";
import { Success } from "../responses/success";
import { BadRequest, ServerError } from "../responses/errors";
import { iCloudInterface } from "@server/api/interfaces/iCloudInterface";

export class iCloudRouter {
    static async getAccountInfo(ctx: RouterContext, _: Next) {
        try {
            const data: any = await iCloudInterface.getAccountInfo();
            return new Success(ctx, { message: "Successfully fetched account info!", data }).send();
        } catch (ex: any) {
            throw new ServerError({ message: "Failed to fetch account info!", error: ex?.message ?? ex.toString() });
        }
    }

    static async getContactCard(ctx: RouterContext, _: Next) {
        try {
            const { address } = ctx.request.query;
            const data: any = await iCloudInterface.getContactCard(address as string);
            return new Success(ctx, { message: "Successfully fetched contact card!", data }).send();
        } catch (ex: any) {
            throw new ServerError({ message: "Failed to fetch contact card!", error: ex?.message ?? ex.toString() });
        }
    }

    static async setContactCardAvatar(ctx: RouterContext, _: Next) {
        const avatar = ctx.request.files?.avatar as unknown as File;
        if (!avatar || avatar.size === 0) {
            throw new BadRequest({ error: "Avatar not provided or was empty!" });
        }

        try {
            await iCloudInterface.setContactCardAvatar(avatar.path);
            return new Success(ctx, { message: "Successfully set contact card photo!" }).send();
        } catch (ex: unknown) {
            const error = ex instanceof Error ? ex.message : String(ex);
            throw new ServerError({ message: "Failed to set contact card photo!", error });
        }
    }

    static async changeAlias(ctx: RouterContext, _: Next) {
        try {
            const { alias } = ctx?.request?.body ?? {};
            const data: any = await iCloudInterface.modifyActiveAlias(alias);
            return new Success(ctx, { message: "Successfully changed iMessage Alias!", data }).send();
        } catch (ex: any) {
            throw new ServerError({ message: "Failed to change iMessage Alias", error: ex?.message ?? ex.toString() });
        }
    }
}
