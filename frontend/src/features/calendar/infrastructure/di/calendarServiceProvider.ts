import { ensureDIConfigured } from "@/core/infrastructure/di/container";
import { container } from "tsyringe";
import {
  GetCalendarByIdUseCase,
  GetCalendarsUseCase,
} from "../../application/useCases";
import { CreateCalendarUseCase } from "../../application/useCases/createCalendarUseCase";
import { UpdateCalendarUseCase } from "../../application/useCases/updateCalendarUseCase";
import { UpdateCalendarStatusUseCase } from "../../application/useCases/updateCalendarStatusUseCase";
import { UpdateExpectedSalesCountUseCase } from "../../application/useCases/updateExpectedSalesCountUseCase";

export class CalendarServiceProvider {
  static getGetCalendarsUseCase(): GetCalendarsUseCase {
    ensureDIConfigured();
    return container.resolve(GetCalendarsUseCase);
  }

  static getGetCalendarByIdUseCase(): GetCalendarByIdUseCase {
    ensureDIConfigured();
    return container.resolve(GetCalendarByIdUseCase);
  }

  static getCreateCalendarUseCase(): CreateCalendarUseCase {
    ensureDIConfigured();
    return container.resolve(CreateCalendarUseCase);
  }

  static getUpdateCalendarUseCase(): UpdateCalendarUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateCalendarUseCase);
  }

  static getUpdateCalendarStatusUseCase(): UpdateCalendarStatusUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateCalendarStatusUseCase);
  }

  static getUpdateExpectedSalesCountUseCase(): UpdateExpectedSalesCountUseCase {
    ensureDIConfigured();
    return container.resolve(UpdateExpectedSalesCountUseCase);
  }
}
