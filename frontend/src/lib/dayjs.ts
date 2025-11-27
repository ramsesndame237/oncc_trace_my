import dayjs, { extend } from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/fr";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localizedFormat from "dayjs/plugin/localizedFormat";
import objectSupport from "dayjs/plugin/objectSupport";
import utc from "dayjs/plugin/utc";
import weekday from "dayjs/plugin/weekday";

extend(weekday);
extend(localizedFormat);
extend(customParseFormat);
extend(utc);
extend(objectSupport);

// Note: La locale par défaut est 'fr'
// mais elle sera automatiquement changée dynamiquement
// par le hook useDayjsLocale dans I18nProvider
dayjs.locale("fr");

export { dayjs };

export const isPastDate = (date: string, dateEnd?: string): boolean => {
  const dateToCompare = dayjs(date);
  const dateEndToCompare = dayjs(dateEnd);
  return dateToCompare.isBefore(dateEndToCompare);
};
