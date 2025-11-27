import { db } from "@/core/infrastructure/database/db";
import { injectable } from "tsyringe";

export interface StepErrorInfo {
  code: string;
  message: string;
  timestamp: number;
  step: string;
}

@injectable()
export class StepErrorService {
  /**
   * Gestion centralisée des erreurs par étape
   * @param operationId - ID de l'opération en cours
   * @param step - Étape où l'erreur s'est produite
   * @param errorCode - Code d'erreur spécifique
   * @param error - Erreur originale
   */
  async handleStepError(
    operationId: number,
    step: string,
    errorCode: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any
  ): Promise<void> {
    const lastError: StepErrorInfo = {
      code: errorCode,
      message: error instanceof Error ? error.message : "Erreur inconnue",
      timestamp: Date.now(),
      step: step,
    };

    const operation = await db.pendingOperations.get(operationId);
    await db.pendingOperations.update(operationId, {
      lastError: lastError,
      retries: (operation?.retries || 0) + 1,
    });
  }
}
