import { useTranslation } from "react-i18next";
import { useLocationHierarchy } from "../hooks/useLocationHierarchy";

export const HierarchyDisplay = ({ code }: { code: string }) => {
  const { t } = useTranslation("location");
  const { path, isLoading } = useLocationHierarchy(code);

  if (isLoading) {
    return <span className="text-xs text-gray-500">{t("hierarchy.loading")}</span>;
  }

  return (
    <span>
      {path.map((segment, index) => (
        <span key={segment.code}>
          {index > 0 && " / "}
          {segment.name}
        </span>
      ))}
    </span>
  );
};
