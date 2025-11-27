import { injectable } from "tsyringe";
import i18next from "i18next";
import type { AuditLog } from "../../domain";

@injectable()
export class AuditLogService {

  formatDate(dateString: string): string {
    const locale = i18next.language || 'fr';
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  formatUserName(user: AuditLog['user']): string {
    if (!user) return i18next.t('auditLog:modal.labels.system')
    return `${user.givenName} ${user.familyName}`
  }

  formatAction(action: string): string {
    const actionKey = `auditLog:actions.${action}`;
    const translated = i18next.t(actionKey);

    // If translation key not found, return the original action
    return translated !== actionKey ? translated : action;
  }

  hasChanges(log: AuditLog): boolean {
    return log.changed_fields && log.changed_fields.length > 0
  }
}