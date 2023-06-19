import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { event } from "@prisma/client";
import { ICreateEvent } from "./create-event.interface";
import { logger } from "nx/src/utils/logger";

@Injectable()
export class EventService {

  private readonly logger = new Logger(EventService.name, { timestamp: true });


  constructor(
    private readonly prismaService: PrismaService
  ) { }
  async createEvent(data: ICreateEvent): Promise<event> {
    try {
      return null;
      // return this.prismaService.event.create({
      //   data: {
      //     ...data,
      //     user: data.user ? { connect: { id: data.user.id }} : undefined,
      //     trial: data.trial ? { connect: { id: data.trial.id }} : undefined,
      //     ctml_json: data.ctml_json ? { connect: { id: data.ctml_json.id }} : undefined,
      //     ctml_schema: data.ctml_schema ? { connect: { id: data.ctml_schema.id }} : undefined
      //   }
      // });
    } catch (e) {
      logger.error(`Error while creating audit log with input: ${{...data}}`);
    }
  }
}