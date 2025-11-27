import { type ReactElement } from "react";

type CustomIconProps = {
  className?: string;
} & React.HTMLAttributes<SVGElement>;

export type CustomIcon = (
  props: CustomIconProps
) => ReactElement<SVGSVGElement>;
